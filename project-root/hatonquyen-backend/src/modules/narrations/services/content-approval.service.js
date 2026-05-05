const Narration = require('../models/narration.model');

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const toLanguageCode = (language = '') => {
  const normalized = String(language).toLowerCase();
  if (normalized.startsWith('vi')) return 'vi';
  if (normalized.startsWith('en')) return 'en';
  if (normalized.startsWith('zh')) return 'zh';
  if (normalized.startsWith('ja')) return 'ja';
  if (normalized.startsWith('fr')) return 'fr';
  return 'vi';
};

const wordCount = (value = '') => String(value).trim().split(/\s+/).filter(Boolean).length;

const formatSubmittedLabel = (date) => {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const mapSubmission = (item) => ({
  id: String(item._id),
  title: item.title,
  language: toLanguageCode(item.language),
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
  submittedAt: item.createdAt?.toISOString(),
  submittedLabel: formatSubmittedLabel(item.createdAt || new Date()),
  status: item.status,
  wordCount: wordCount(item.fullText || item.script),
  contentType: 'script',
  body: {
    shortText: item.shortText,
    fullText: item.fullText,
    script: item.script,
  },
  moderation: {
    qualityScore: Math.min(100, Math.max(40, Math.round(wordCount(item.fullText || item.script) / 4))),
    reviewerName: item.reviewedBy?.fullName,
    lastReviewedAt: item.reviewedAt?.toISOString(),
    note: item.moderationNote || 'Đang chờ duyệt.',
    revisionMessage: item.revisionMessage || undefined,
    rejectedReason: item.rejectedReason || undefined,
  },
});

const applyFilters = (items, filters = {}) => {
  let next = items;

  if (filters.query) {
    const query = String(filters.query).toLowerCase();
    next = next.filter((item) =>
      [item.title, item.relatedPOI.name, item.submittedBy.name, item.submittedBy.email, item.body.shortText]
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }

  if (filters.status && filters.status !== 'all') {
    next = next.filter((item) => item.status === filters.status);
  }

  if (filters.language && filters.language !== 'all') {
    next = next.filter((item) => item.language === filters.language);
  }

  return next;
};

const fetchContentSubmissions = async (filters = {}) => {
  const query = {};
  const page = Math.max(1, Number(filters.page || 1));
  const limit = Math.min(100, Math.max(1, Number(filters.limit || 20)));

  if (filters.status && filters.status !== 'all') {
    query.status = filters.status;
  }

  if (filters.language && filters.language !== 'all') {
    query.language = filters.language;
  }

  const [narrations, totalFiltered] = await Promise.all([
    Narration.find(query)
      .populate('poi', 'name')
      .populate('submittedBy', 'fullName email')
      .populate('reviewedBy', 'fullName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Narration.countDocuments(query),
  ]);

  const mapped = narrations.map(mapSubmission);
  const data = filters.query ? applyFilters(mapped, { query: filters.query }) : mapped;

  const [total, pending, approved, revisionRequested, rejected] = await Promise.all([
    Narration.countDocuments({}),
    Narration.countDocuments({ status: 'pending' }),
    Narration.countDocuments({ status: 'approved' }),
    Narration.countDocuments({ status: 'revision_requested' }),
    Narration.countDocuments({ status: 'rejected' }),
  ]);

  return {
    data,
    meta: {
      total,
      pending,
      approved,
      revisionRequested,
      rejected,
      readyToApprove: pending,
      currentPage: page,
      pageSize: limit,
      totalPages: Math.ceil(totalFiltered / limit),
      totalFiltered,
    },
  };
};

const updateModerationStatus = async ({ submissionId, status, note, reviewerId, reviewerName }) => {
  const narration = await Narration.findById(submissionId);
  if (!narration) {
    throw createHttpError(404, 'Content submission not found');
  }

  narration.status = status;
  narration.moderationNote = String(note || '').trim() || narration.moderationNote || 'Updated by admin.';
  narration.reviewedBy = reviewerId || narration.reviewedBy || null;
  narration.reviewedAt = new Date();

  narration.revisionMessage = status === 'revision_requested' ? narration.moderationNote : null;
  narration.rejectedReason = status === 'rejected' ? narration.moderationNote : null;

  await narration.save();

  const updated = await Narration.findById(narration._id)
    .populate('poi', 'name')
    .populate('submittedBy', 'fullName email')
    .populate('reviewedBy', 'fullName');

  const submissions = await fetchContentSubmissions();

  const mapped = mapSubmission(updated);
  if (reviewerName) {
    mapped.moderation.reviewerName = reviewerName;
  }

  return {
    submission: mapped,
    meta: submissions.meta,
  };
};

const approveContentSubmission = async (submissionId, payload) =>
  updateModerationStatus({
    submissionId,
    status: 'approved',
    note: payload?.note,
    reviewerId: payload?.reviewerId,
    reviewerName: payload?.reviewerName,
  });

const requestRevisionForContent = async (submissionId, payload) => {
  const message = String(payload?.message || '').trim();
  if (message.length < 12) {
    throw createHttpError(400, 'Revision message must be at least 12 characters');
  }

  return updateModerationStatus({
    submissionId,
    status: 'revision_requested',
    note: message,
    reviewerId: payload?.reviewerId,
    reviewerName: payload?.reviewerName,
  });
};

const rejectContentSubmission = async (submissionId, payload) => {
  const reason = String(payload?.reason || '').trim();
  if (reason.length < 12) {
    throw createHttpError(400, 'Reject reason must be at least 12 characters');
  }

  return updateModerationStatus({
    submissionId,
    status: 'rejected',
    note: reason,
    reviewerId: payload?.reviewerId,
    reviewerName: payload?.reviewerName,
  });
};

module.exports = {
  fetchContentSubmissions,
  approveContentSubmission,
  requestRevisionForContent,
  rejectContentSubmission,
};
