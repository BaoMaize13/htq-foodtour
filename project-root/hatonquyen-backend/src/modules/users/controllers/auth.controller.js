const {
  loginUser,
  registerOwner,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
} = require('../services/auth.service');

const User = require('../models/user.model');
const AuditLog = require('../../admin/models/audit-log.model');

const SUPPORTED_LANGUAGES = [
    'vi',
    'en',
    'ko',
    'ja',
    'zh-Hans',
    'zh-Hant',
    'es',
    'de',
    'fr',
    'ru',
];

const normalizeLanguageCode = (value) => {
    if (!value || typeof value !== 'string') {
        return 'vi';
    }

    const code = value.trim();

    switch (code.toLowerCase()) {
        case 'vi':
            return 'vi';
        case 'en':
            return 'en';
        case 'ko':
            return 'ko';
        case 'ja':
            return 'ja';
        case 'es':
            return 'es';
        case 'de':
            return 'de';
        case 'fr':
            return 'fr';
        case 'ru':
            return 'ru';
        case 'zh-hans':
        case 'zh_hans':
        case 'zh-cn':
            return 'zh-Hans';
        case 'zh-hant':
        case 'zh_hant':
        case 'zh-tw':
            return 'zh-Hant';
        default:
            return code;
    }
};

const getAuthUserId = (authUser) => {
    return (
        authUser?.id ||
        authUser?._id ||
        authUser?.userId ||
        authUser?.sub ||
        null
    );
};

const login = async (req, res, next) => {
    try {
        const data = await loginUser(req.body);

        try {
            const roleCode = String(data?.role?.code || '').toUpperCase();

            const actorLabel =
                roleCode === 'OWNER'
                    ? 'Chủ quán'
                    : roleCode === 'USER'
                        ? 'Người dùng'
                        : 'Tài khoản';

            const newLogRecord = await AuditLog.create({
                adminUser:
                    data?.user?.fullName ||
                    data?.user?.email ||
                    'Tài khoản không xác định',
                action: `${actorLabel} đăng nhập thành công`,
                targetId: String(data?.user?.id || 'unknown'),
            });

            const io = req.app.get('io');

            if (io) {
                io.emit('new_audit_log', {
                    id: String(newLogRecord._id),
                    adminUser: newLogRecord.adminUser,
                    action: newLogRecord.action,
                    targetId: newLogRecord.targetId,
                    timestamp: newLogRecord.timestamp,
                });
            }
        } catch (auditError) {
            console.error(
                'Không thể ghi hoặc phát sự kiện audit log:',
                auditError.message
            );
        }

        return res.status(200).json({
            message: 'Login successful',
            data,
        });
    } catch (error) {
        return next(error);
    }
};

const registerOwnerAccount = async (req, res, next) => {
    try {
        const data = await registerOwner(req.body);

        return res.status(201).json({
            message: 'Owner registration submitted. Your account is pending approval.',
            data,
        });
    } catch (error) {
        return next(error);
    }
};

const changeCurrentUserPassword = async (req, res, next) => {
    try {
        await changePassword({
            authUser: req.user,
            currentPassword: req.body?.currentPassword,
            newPassword: req.body?.newPassword,
        });

        return res.status(200).json({
            message: 'Password changed successfully',
        });
    } catch (error) {
        return next(error);
    }
};

const forgotUserPassword = async (req, res, next) => {
    try {
        const data = await forgotPassword({
            email: req.body?.email,
        });

        return res.status(200).json({
            message: data.message,
            data: {
                devResetToken: data.devResetToken,
                expiresAt: data.expiresAt,
            },
        });
    } catch (error) {
        return next(error);
    }
};

const resetUserPassword = async (req, res, next) => {
    try {
        await resetPassword({
            token: req.body?.token,
            newPassword: req.body?.newPassword,
        });

        return res.status(200).json({
            message: 'Password reset successfully',
        });
    } catch (error) {
        return next(error);
    }
};

const updateCurrentUserProfile = async (req, res, next) => {
    try {
        const data = await updateProfile({
            authUser: req.user,
            fullName: req.body?.fullName,
            email: req.body?.email,
        });

        return res.status(200).json({
            message: 'Profile updated successfully',
            data,
        });
    } catch (error) {
        return next(error);
    }
};

const getCurrentUserPreferences = async (req, res, next) => {
    try {
        const userId = getAuthUserId(req.user);

        if (!userId) {
            return res.status(401).json({
                code: 'AUTH_USER_NOT_FOUND',
                message: 'Authenticated user not found',
            });
        }

        const user = await User.findById(userId).select(
            '_id fullName email preferredLanguage'
        );

        if (!user) {
            return res.status(404).json({
                code: 'USER_NOT_FOUND',
                message: 'User not found',
            });
        }

        const preferredLanguage = user.preferredLanguage || 'vi';

        return res.status(200).json({
            preferredLanguage,
            data: {
                preferredLanguage,
            },
        });
    } catch (error) {
        return next(error);
    }
};

const updateCurrentUserPreferredLanguage = async (req, res, next) => {
    try {
        const userId = getAuthUserId(req.user);

        if (!userId) {
            return res.status(401).json({
                code: 'AUTH_USER_NOT_FOUND',
                message: 'Authenticated user not found',
            });
        }

        const preferredLanguage = normalizeLanguageCode(req.body?.preferredLanguage);

        if (!SUPPORTED_LANGUAGES.includes(preferredLanguage)) {
            return res.status(400).json({
                code: 'UNSUPPORTED_LANGUAGE',
                message: 'Unsupported language',
            });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    preferredLanguage,
                },
            },
            {
                new: true,
            }
        ).select('_id fullName email preferredLanguage');

        if (!user) {
            return res.status(404).json({
                code: 'USER_NOT_FOUND',
                message: 'User not found',
            });
        }

        return res.status(200).json({
            message: 'Preferred language updated successfully',
            preferredLanguage: user.preferredLanguage,
            data: {
                preferredLanguage: user.preferredLanguage,
            },
        });
    } catch (error) {
        return next(error);
    }
};

module.exports = {
        login,
        registerOwnerAccount,
        updateCurrentUserProfile,
        getCurrentUserPreferences,
        updateCurrentUserPreferredLanguage,
        changeCurrentUserPassword,
        forgotUserPassword,
        resetUserPassword,
};