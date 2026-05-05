const express = require('express');
const verifyAccessToken = require('../../middlewares/verify-access-token.middleware');
const requireRole = require('../../middlewares/require-role.middleware');
const MenuItem = require('../menu/models/menu-item.model');
const Review = require('../reviews/models/review.model');
const User = require('../users/models/user.model');
const OwnerProfile = require('../users/models/owner-profile.model');
const POI = require('../places/models/poi.model');
const Narration = require('../narrations/models/narration.model');
const AudioAsset = require('../narrations/models/audio-asset.model');
const AuditLog = require('./models/audit-log.model');

const router = express.Router();

const REVIEW_COUNT_MULTIPLIER = Number(process.env.REVIEW_COUNT_MULTIPLIER || 1);

const normalizeReviewStatus = (status) => {
    const value = String(status || '').trim().toLowerCase();

    if (['published', 'approved', 'active'].includes(value)) return 'published';
    if (['hidden', 'archived', 'inactive'].includes(value)) return 'hidden';
    if (['pending', 'pending_approval', 'draft'].includes(value)) return 'pending';
    if (value === 'rejected') return 'rejected';

    return value || 'published';
};

const toReviewDbStatus = (status) => {
    const value = normalizeReviewStatus(status);

    if (value === 'published') return 'published';
    if (value === 'hidden') return 'hidden';
    if (value === 'pending') return 'pending';
    if (value === 'rejected') return 'rejected';

    return null;
};

router.use(verifyAccessToken, requireRole('ADMIN'));

const mapAdminNarration = (item) => ({
    id: String(item._id),
    poiId: item.poi ? String(item.poi._id || item.poi) : null,
    title: item.title,
    shortText: item.shortText,
    script: item.script,
    fullText: item.fullText,
    images: item.images || [],
    language: String(item.language || '').slice(0, 2) || 'vi',
    status: item.status,
    poiName: item.poi?.name || 'POI',
    poiIcon: '📍',
    wordCount: String(item.fullText || item.script || '').trim().split(/\s+/).filter(Boolean).length,
    audioDuration: '1:30',
    updatedAt: item.updatedAt,
});

const mapAuditLog = (item) => ({
    id: String(item._id),
    adminUser: item.adminUser,
    action: item.action,
    targetId: item.targetId,
    timestamp: item.timestamp,
});

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizePositiveInteger = (value, fallback, max = 100) => {
    const parsed = Number.parseInt(String(value || ''), 10);

    if (!Number.isFinite(parsed) || parsed <= 0) {
        return fallback;
    }

    return Math.min(parsed, max);
};

const mapAdminUser = (item) => ({
    id: String(item._id),
    fullName: item.fullName,
    email: item.email,
    role: item.roleCode || String(item.role?.code || '').toLowerCase() || 'user',
    accountStatus: item.accountStatus || 'active',
});

router.get('/audit-logs', async (req, res, next) => {
    try {
        const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(50);

        return res.status(200).json({
            data: logs.map(mapAuditLog),
        });
    } catch (error) {
        return next(error);
    }
});

router.get('/dashboard/summary', async (req, res, next) => {
    try {
        const [totalPOIs, pendingOwnerApprovals, totalUsers, realTotalReviews] = await Promise.all([
            POI.countDocuments(),
            OwnerProfile.countDocuments({ status: 'pending' }),
            User.countDocuments(),
            Review.countDocuments(),
        ]);

        return res.status(200).json({
            data: {
                totalPOIs,
                pendingOwnerApprovals,
                totalUsers,
                totalReviews: realTotalReviews * REVIEW_COUNT_MULTIPLIER,
            },
        });
    } catch (error) {
        return next(error);
    }
});

router.get('/narrations', async (req, res, next) => {
    try {
        const narrations = await Narration.find().populate('poi', 'name').sort({ updatedAt: -1 });
        console.log('Fetched admin narrations:', narrations.length);
        return res.status(200).json({ data: narrations.map(mapAdminNarration) });
    } catch (error) {
        return next(error);
    }
});

router.delete('/narrations/:id', async (req, res, next) => {
    try {
        const narration = await Narration.findById(req.params.id);
        if (!narration) {
            return res.status(404).json({ message: 'Narration not found' });
        }

        await Narration.deleteOne({ _id: narration._id });
        return res.status(200).json({ message: 'Narration deleted successfully' });
    } catch (error) {
        return next(error);
    }
});

router.get('/content-approval/pending', async (req, res, next) => {
    try {
        const narrations = await Narration.find({ status: 'pending_approval' })
            .populate('poi', 'name')
            .populate('submittedBy', 'fullName email')
            .sort({ createdAt: -1 });

        console.log('Fetched pending narrations:', narrations.length);

        const data = narrations.map((item) => ({
            id: String(item._id),
            title: item.title,
            language: String(item.language || '').slice(0, 2) || 'vi',
            relatedPOI: {
                id: String(item.poi?._id || ''),
                name: item.poi?.name || 'POI',
                icon: '📍',
            },
            submittedBy: {
                id: String(item.submittedBy?._id || ''),
                name: item.submittedBy?.fullName || 'Owner',
                email: item.submittedBy?.email || '',
                roleLabel: 'Owner',
            },
            submittedAt: item.createdAt,
            submittedLabel: new Date(item.createdAt).toLocaleString('vi-VN'),
            status: 'pending',
            wordCount: String(item.fullText || item.script || '').trim().split(/\s+/).filter(Boolean).length,
            contentType: 'script',
            body: {
                shortText: item.shortText,
                fullText: item.fullText,
                script: item.script,
            },
            moderation: {
                qualityScore: 75,
                note: item.moderationNote || 'Đang chờ duyệt',
                rejectedReason: item.rejectedReason || undefined,
            },
        }));

        return res.status(200).json({
            data,
            meta: {
                total: data.length,
                pending: data.length,
                approved: 0,
                revisionRequested: 0,
                rejected: 0,
                readyToApprove: data.length,
            },
        });
    } catch (error) {
        return next(error);
    }
});

router.put('/content-approval/:id/approve', async (req, res, next) => {
    try {
        const narration = await Narration.findById(req.params.id);
        if (!narration) return res.status(404).json({ message: 'Narration not found' });

        narration.status = 'published';
        narration.reviewedBy = req.user?.userId;
        narration.reviewedAt = new Date();
        narration.moderationNote = req.body?.note || 'Approved by admin';
        await narration.save();

        return res.status(200).json({ message: 'Content approved' });
    } catch (error) {
        return next(error);
    }
});

router.put('/content-approval/:id/reject', async (req, res, next) => {
    try {
        const reason = String(req.body?.reason || '').trim();
        if (!reason) return res.status(400).json({ message: 'Reject reason is required' });

        const narration = await Narration.findById(req.params.id);
        if (!narration) return res.status(404).json({ message: 'Narration not found' });

        narration.status = 'rejected';
        narration.rejectedReason = reason;
        narration.reviewedBy = req.user?.userId;
        narration.reviewedAt = new Date();
        await narration.save();

        return res.status(200).json({ message: 'Content rejected' });
    } catch (error) {
        return next(error);
    }
});

router.put('/content-approval/:id/revision', async (req, res, next) => {
    try {
        const message = String(req.body?.message || '').trim();
        if (!message) return res.status(400).json({ message: 'Revision message is required' });

        const narration = await Narration.findById(req.params.id);
        if (!narration) return res.status(404).json({ message: 'Narration not found' });

        narration.status = 'draft';
        narration.revisionMessage = message;
        narration.reviewedBy = req.user?.userId;
        narration.reviewedAt = new Date();
        await narration.save();

        return res.status(200).json({ message: 'Revision requested' });
    } catch (error) {
        return next(error);
    }
});

router.get('/audio-tasks', async (req, res, next) => {
    try {
        const records = await AudioAsset.find()
            .populate({ path: 'narration', populate: { path: 'poi', select: 'name' }, select: 'title language poi' })
            .populate('poi', 'name')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            data: records.map((item) => ({
                id: String(item._id),
                target: `${item.poi?.name || item.narration?.poi?.name || 'POI'} / ${item.narration?.title || item.fileName}`,
                language: String(item.language || '').slice(0, 2) || 'vi',
                voice: item.voice || 'Female (Nữ Nam)',
                status: item.status,
                duration: `${Math.floor(item.duration / 60)}:${String(Math.floor(item.duration % 60)).padStart(2, '0')}`,
                audioUrl: item.status === 'completed' ? item.audioUrl : null,
            })),
        });
    } catch (error) {
        return next(error);
    }
});

router.get('/menus', async (req, res, next) => {
    try {
        const data = await MenuItem.find().populate('poiId', 'name').sort({ createdAt: -1 });
        return res.status(200).json({
            data: data.map((item) => ({
                id: String(item._id),
                name: item.name,
                poi: item.poiId ? { id: String(item.poiId._id), name: item.poiId.name } : null,
                price: item.price,
                category: item.category,
                status: item.status,
            })),
        });
    } catch (error) {
        return next(error);
    }
});

router.put('/menus/:id/status', async (req, res, next) => {
    try {
        const nextStatus = req.body?.status;
        if (!['active', 'hidden'].includes(nextStatus)) {
            return res.status(400).json({ message: 'Invalid menu status' });
        }

        const menu = await MenuItem.findByIdAndUpdate(req.params.id, { status: nextStatus }, { new: true }).populate('poiId', 'name');
        if (!menu) {
            return res.status(404).json({ message: 'Menu item not found' });
        }

        return res.status(200).json({
            data: {
                id: String(menu._id),
                name: menu.name,
                poi: menu.poiId ? { id: String(menu.poiId._id), name: menu.poiId.name } : null,
                price: menu.price,
                category: menu.category,
                status: menu.status,
            },
        });
    } catch (error) {
        return next(error);
    }
});

router.delete('/menus/:id', async (req, res, next) => {
    try {
        const menu = await MenuItem.findById(req.params.id);
        if (!menu) {
            return res.status(404).json({ message: 'Menu item not found' });
        }

        await MenuItem.deleteOne({ _id: menu._id });
        return res.status(200).json({ message: 'Menu item deleted successfully' });
    } catch (error) {
        return next(error);
    }
});

router.get('/reviews', async (req, res, next) => {
    try {
        // Admin phải thấy toàn bộ review. Không filter theo status ở backend để tránh trường hợp
        // frontend gửi status=active/approved nhưng review mới đang lưu là published rồi bị mất khỏi bảng.
        const data = await Review.find()
            .populate('poiId', 'name')
            .populate('userId', 'fullName email')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            data: data.map((item) => ({
                id: String(item._id),
                user: item.userId
                    ? { id: String(item.userId._id), fullName: item.userId.fullName, email: item.userId.email }
                    : null,
                poi: item.poiId ? { id: String(item.poiId._id), name: item.poiId.name } : null,
                rating: item.rating,
                content: item.content,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
                status: item.status || 'published',
                normalizedStatus: normalizeReviewStatus(item.status),
            })),
            meta: {
                total: data.length * REVIEW_COUNT_MULTIPLIER,
                realTotal: data.length,
            },
        });
    } catch (error) {
        return next(error);
    }
});

router.put('/reviews/:id/status', async (req, res, next) => {
    try {
        const nextStatus = toReviewDbStatus(req.body?.status);

        if (!nextStatus || !['published', 'hidden', 'pending', 'rejected'].includes(nextStatus)) {
            return res.status(400).json({ message: 'Invalid review status' });
        }

        const review = await Review.findByIdAndUpdate(req.params.id, { status: nextStatus }, { new: true })
            .populate('poiId', 'name')
            .populate('userId', 'fullName email');

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        return res.status(200).json({
            data: {
                id: String(review._id),
                user: review.userId
                    ? { id: String(review.userId._id), fullName: review.userId.fullName, email: review.userId.email }
                    : null,
                poi: review.poiId ? { id: String(review.poiId._id), name: review.poiId.name } : null,
                rating: review.rating,
                content: review.content,
                createdAt: review.createdAt,
                updatedAt: review.updatedAt,
                status: review.status || 'published',
                normalizedStatus: normalizeReviewStatus(review.status),
            },
        });
    } catch (error) {
        return next(error);
    }
});

router.delete('/reviews/:id', async (req, res, next) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        await Review.deleteOne({ _id: review._id });
        return res.status(200).json({ message: 'Review deleted successfully' });
    } catch (error) {
        return next(error);
    }
});

router.get('/users', async (req, res, next) => {
    try {
        const page = normalizePositiveInteger(req.query.page, 1, 100000);
        const limit = normalizePositiveInteger(req.query.limit, 10, 50);
        const skip = (page - 1) * limit;
        const search = String(req.query.search || '').trim();

        const query = {};

        if (search) {
            const keyword = new RegExp(escapeRegex(search), 'i');

            query.$or = [
                { fullName: keyword },
                { email: keyword },
                { username: keyword },
                { roleCode: keyword },
                { accountStatus: keyword },
            ];
        }

        const [data, total] = await Promise.all([
            User.find(query)
                .populate('role', 'code name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            User.countDocuments(query),
        ]);

        const totalPages = Math.max(1, Math.ceil(total / limit));

        return res.status(200).json({
            data: data.map(mapAdminUser),
            meta: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        });
    } catch (error) {
        return next(error);
    }
});

router.put('/users/:id/role', async (req, res, next) => {
    try {
        const nextRole = req.body?.role;
        if (!['admin', 'moderator', 'editor', 'user', 'owner'].includes(nextRole)) {
            return res.status(400).json({ message: 'Invalid user role' });
        }

        const user = await User.findByIdAndUpdate(req.params.id, { roleCode: nextRole }, { new: true }).populate('role', 'code name');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({
            data: mapAdminUser(user),
        });
    } catch (error) {
        return next(error);
    }
});

router.put('/users/:id/status', async (req, res, next) => {
    try {
        const nextStatus = req.body?.status;
        if (!['active', 'suspended'].includes(nextStatus)) {
            return res.status(400).json({ message: 'Invalid account status' });
        }

        const user = await User.findByIdAndUpdate(req.params.id, { accountStatus: nextStatus }, { new: true }).populate('role', 'code name');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({
            data: mapAdminUser(user),
        });
    } catch (error) {
        return next(error);
    }
});

router.get('/owners/active', async (req, res, next) => {
    try {
        const owners = await OwnerProfile.find({ status: 'approved' }).populate('user', 'fullName email roleCode accountStatus');
        return res.status(200).json({
            data: owners
                .filter((item) => item.user)
                .map((item) => ({
                    id: String(item._id),
                    ownerId: String(item.user._id),
                    fullName: item.user.fullName,
                    email: item.user.email,
                    accountStatus: item.user.accountStatus || 'active',
                    businessName: item.businessName,
                })),
        });
    } catch (error) {
        return next(error);
    }
});

router.put('/owners/:id/suspend', async (req, res, next) => {
    try {
        const ownerProfile = await OwnerProfile.findById(req.params.id).populate('user', 'fullName email roleCode accountStatus');
        if (!ownerProfile || !ownerProfile.user) {
            return res.status(404).json({ message: 'Owner not found' });
        }

        const nextStatus = ownerProfile.user.accountStatus === 'suspended' ? 'active' : 'suspended';
        const user = await User.findByIdAndUpdate(ownerProfile.user._id, { accountStatus: nextStatus }, { new: true });

        return res.status(200).json({
            data: {
                id: String(ownerProfile._id),
                ownerId: String(user._id),
                fullName: user.fullName,
                email: user.email,
                accountStatus: user.accountStatus,
                businessName: ownerProfile.businessName,
            },
        });
    } catch (error) {
        return next(error);
    }
});

module.exports = router;
