const mongoose = require('mongoose');
const OwnerProfile = require('../models/owner-profile.model');
const User = require('../models/user.model');

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const formatSubmittedLabel = (date) => {
  const target = new Date(date);
  const pad = (value) => String(value).padStart(2, '0');
  return `${pad(target.getDate())}/${pad(target.getMonth() + 1)}/${target.getFullYear()} · ${pad(target.getHours())}:${pad(target.getMinutes())}`;
};

const buildOwnerDocuments = (profile) => {
  const hasBasic = Boolean(profile.businessName && profile.businessAddress);
  const hasId = Boolean(profile.idCardNumber);

  return [
    { id: `${profile._id}-business-license`, label: 'Giấy phép KD', type: 'business_license', status: hasBasic ? 'submitted' : 'missing' },
    { id: `${profile._id}-citizen-id`, label: 'CCCD', type: 'citizen_id', status: hasId ? 'submitted' : 'missing' },
    { id: `${profile._id}-frontage`, label: 'Ảnh mặt tiền', type: 'frontage_photo', status: hasBasic ? 'submitted' : 'missing' },
    { id: `${profile._id}-tax-code`, label: 'Mã số thuế', type: 'tax_code', status: hasId ? 'submitted' : 'missing' },
  ];
};

const buildOwnerApplication = (profile) => {
  const documents = buildOwnerDocuments(profile);
  const submittedCount = documents.filter((item) => item.status === 'submitted').length;
  const completenessScore = Math.round((submittedCount / documents.length) * 100);
  const riskLevel = completenessScore < 90 ? 'attention' : 'standard';

  return {
    id: String(profile._id),
    owner: {
      fullName: profile.user?.fullName || 'Unknown owner',
      email: profile.user?.email || '',
    },
    business: {
      name: profile.businessName,
      address: profile.businessAddress,
      cuisine: 'Ẩm thực Hoa',
    },
    submittedAt: profile.submittedAt?.toISOString() || profile.createdAt.toISOString(),
    submittedLabel: formatSubmittedLabel(profile.submittedAt || profile.createdAt),
    status: profile.status,
    documents,
    review: {
      riskLevel,
      completenessScore,
      coverageLabel: profile.status === 'approved'
        ? 'Đã phê duyệt'
        : profile.status === 'rejected'
          ? 'Đã từ chối do hồ sơ chưa đạt'
          : `Hồ sơ đầy đủ ${completenessScore}%`,
      adminNote: profile.rejectionReason || 'Đang chờ admin duyệt hồ sơ.',
      rejectionReason: profile.rejectionReason || undefined,
      reviewerName: profile.status !== 'pending' ? 'Smart Food Tour Admin' : undefined,
      lastActionAt: profile.updatedAt?.toISOString(),
    },
  };
};

const summarizeOwnerApplications = (items) => {
  const todayKey = new Date().toDateString();

  return {
    total: items.length,
    pending: items.filter((item) => item.status === 'pending').length,
    approved: items.filter((item) => item.status === 'approved').length,
    rejected: items.filter((item) => item.status === 'rejected').length,
    needsAttention: items.filter((item) => item.status === 'pending' && item.review.riskLevel === 'attention').length,
    approvedToday: items.filter((item) => item.status === 'approved' && item.review.lastActionAt && new Date(item.review.lastActionAt).toDateString() === todayKey).length,
  };
};

const applyFilters = (items, filters = {}) => {
  let next = items;

  if (filters.query) {
    const query = String(filters.query).toLowerCase();
    next = next.filter((item) =>
      [item.owner.fullName, item.owner.email, item.business.name, item.business.address]
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }

  if (filters.status && filters.status !== 'all') {
    next = next.filter((item) => item.status === filters.status);
  }

  if (filters.riskLevel && filters.riskLevel !== 'all') {
    next = next.filter((item) => item.review.riskLevel === filters.riskLevel);
  }

  return next;
};

const fetchOwnerApplications = async (filters = {}) => {
  const profiles = await OwnerProfile.find()
    .populate('user', 'fullName email status')
    .sort({ submittedAt: -1, createdAt: -1 });

  const all = profiles.map(buildOwnerApplication);
  const data = applyFilters(all, filters);

  return {
    data,
    meta: summarizeOwnerApplications(all),
  };
};

const approveOwnerApplication = async (applicationId, payload) => {
  const session = await mongoose.startSession();

  try {
    let updatedProfile;

    await session.withTransaction(async () => {
      const profile = await OwnerProfile.findById(applicationId).session(session);
      if (!profile) {
        throw createHttpError(404, 'Owner application not found');
      }

      profile.status = 'approved';
      profile.rejectionReason = null;
      await profile.save({ session });

      await User.updateOne({ _id: profile.user }, { $set: { status: 'active' } }, { session });

      updatedProfile = await OwnerProfile.findById(profile._id).populate('user', 'fullName email status').session(session);
    });

    const applications = await fetchOwnerApplications();

    return {
      application: {
        ...buildOwnerApplication(updatedProfile),
        review: {
          ...buildOwnerApplication(updatedProfile).review,
          adminNote: payload?.note?.trim() || 'Đã phê duyệt hồ sơ chủ cửa hàng.',
          reviewerName: payload?.reviewerName || 'Smart Food Tour Admin',
          lastActionAt: new Date().toISOString(),
        },
      },
      meta: applications.meta,
    };
  } finally {
    await session.endSession();
  }
};

const rejectOwnerApplication = async (applicationId, payload) => {
  const reason = String(payload?.reason || '').trim();
  if (reason.length < 12) {
    throw createHttpError(400, 'Reject reason must be at least 12 characters');
  }

  const session = await mongoose.startSession();

  try {
    let updatedProfile;

    await session.withTransaction(async () => {
      const profile = await OwnerProfile.findById(applicationId).session(session);
      if (!profile) {
        throw createHttpError(404, 'Owner application not found');
      }

      profile.status = 'rejected';
      profile.rejectionReason = reason;
      await profile.save({ session });

      await User.updateOne({ _id: profile.user }, { $set: { status: 'blocked' } }, { session });

      updatedProfile = await OwnerProfile.findById(profile._id).populate('user', 'fullName email status').session(session);
    });

    const applications = await fetchOwnerApplications();

    return {
      application: {
        ...buildOwnerApplication(updatedProfile),
        review: {
          ...buildOwnerApplication(updatedProfile).review,
          adminNote: reason,
          rejectionReason: reason,
          reviewerName: payload?.reviewerName || 'Smart Food Tour Admin',
          lastActionAt: new Date().toISOString(),
        },
      },
      meta: applications.meta,
    };
  } finally {
    await session.endSession();
  }
};

module.exports = {
  fetchOwnerApplications,
  approveOwnerApplication,
  rejectOwnerApplication,
};
