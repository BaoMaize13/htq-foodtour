const express = require('express');
const fs = require('fs');
const path = require('path');
const Narration = require('./models/narration.model');
const AudioAsset = require('./models/audio-asset.model');
const verifyAccessToken = require('../../middlewares/verify-access-token.middleware');
const requireRole = require('../../middlewares/require-role.middleware');
const { synthesizeAndSaveAudio, synthesizeBuffer } = require('./services/tts.service');
const {
  fetchContentSubmissions,
  approveContentSubmission,
  requestRevisionForContent,
  rejectContentSubmission,
} = require('./services/content-approval.service');
const { queueBatchGeneration, cancelBatchJob, listBatchJobs } = require('./services/audio-batch.service');
const {
  validateFetchContentQuery,
  validateBatchGenerateAudioPayload,
  validateCancelAudioJobPayload,
  validateApproveContentPayload,
  validateRevisionPayload,
  validateRejectContentPayload,
} = require('./validators/content-approval.validators');

const router = express.Router();

router.get('/tts', async (req, res, next) => {
  try {
    const text = String(req.query?.text || '').trim();
    const lang = String(req.query?.lang || 'vi');
    const voice = String(req.query?.voice || 'female');

    const buffer = await synthesizeBuffer({ text, language: lang, voiceId: voice });
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(buffer);
  } catch (error) {
    return next(error);
  }
});

router.post('/admin/audio/preview', verifyAccessToken, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { text, language, voiceId, speed } = req.body || {};
    const generated = await synthesizeAndSaveAudio({
      text,
      language,
      voiceId,
      speed,
      protocol: req.protocol,
      host: req.get('host'),
    });

    return res.status(200).json({
      data: {
        url: generated.url,
        filename: generated.filename,
        size: generated.size,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/generate-audio', verifyAccessToken, requireRole('ADMIN', 'OWNER'), async (req, res, next) => {
  try {
    const { text, voiceId, language, narrationId, speed } = req.body || {};
    const generated = await synthesizeAndSaveAudio({
      text,
      voiceId,
      language,
      speed,
      protocol: req.protocol,
      host: req.get('host'),
    });

    let audioAsset = null;
    if (narrationId) {
      const narration = await Narration.findById(narrationId).select('_id poi language title');
      if (narration) {
        audioAsset = await AudioAsset.create({
          poi: narration.poi,
          narration: narration._id,
          language: language || narration.language,
          audioUrl: generated.url,
          fileName: generated.filename,
          sourceType: 'tts',
          duration: 60,
          status: 'completed',
          voice: voiceId || 'female',
        });
      }
    }

    return res.status(200).json({
      data: {
        url: generated.url,
        filename: generated.filename,
        size: generated.size,
        audioAssetId: audioAsset ? String(audioAsset._id) : null,
      },
    });
  } catch (error) {
    return next(error);
  }
});

const formatDuration = (seconds) => {
  const value = Number(seconds);
  if (!Number.isFinite(value) || value <= 0) return '';

  const minutes = Math.floor(value / 60);
  const rest = Math.round(value % 60);
  return `${minutes}:${String(rest).padStart(2, '0')}`;
};

const localUploadExists = (audioUrl) => {
  const value = String(audioUrl || '').trim();
  if (!value.startsWith('/uploads/')) {
    return true;
  }

  const localPath = path.resolve(process.cwd(), 'public', value.replace(/^\/+/, ''));
  return fs.existsSync(localPath);
};

const resolvePlayableAudioAsset = (audioAsset) => {
  if (!audioAsset) {
    return null;
  }

  return localUploadExists(audioAsset.audioUrl) ? audioAsset : null;
};

const buildNarrationPayload = (body = {}, fallback = {}) => {
  const title = String(body.title ?? fallback.title ?? 'Thuyết minh mới').trim() || 'Thuyết minh mới';
  const baseText =
    String(body.script ?? '').trim() ||
    String(body.fullText ?? '').trim() ||
    String(body.shortText ?? '').trim() ||
    String(fallback.script ?? fallback.fullText ?? fallback.shortText ?? '').trim() ||
    title;

  return {
    poi: body.poiId ?? fallback.poi,
    language: body.language ?? fallback.language ?? 'vi',
    title,
    script: baseText,
    shortText: String(body.shortText ?? '').trim() || baseText,
    fullText: String(body.fullText ?? '').trim() || baseText,
    images: Array.isArray(body.images) ? body.images.filter(Boolean) : fallback.images || [],
    status: body.status ?? fallback.status ?? 'draft',
  };
};

const mapNarration = (item, audioAsset = null) => {
  const playableAudioAsset = resolvePlayableAudioAsset(audioAsset);
  const audioStatus = playableAudioAsset?.status || 'missing';
  const duration = formatDuration(playableAudioAsset?.duration);

  return {
    id: String(item._id),
    poiId: item.poi ? String(item.poi._id || item.poi) : null,
    title: item.title,
    shortText: item.shortText,
    language: String(item.language || '').slice(0, 2) || 'vi',
    status: item.status,
    poiName: item.poi?.name || 'POI',
    poiIcon: '📍',
    wordCount: String(item.fullText || item.script || '').trim().split(/\s+/).filter(Boolean).length,
    audioAssetId: playableAudioAsset ? String(playableAudioAsset._id) : null,
    audioStatus,
    audioDuration: duration,
    audioUrl: playableAudioAsset?.audioUrl || '',
    audioFileName: playableAudioAsset?.fileName || '',
    audioSourceType: playableAudioAsset?.sourceType || '',
    updatedAt: item.updatedAt,
    script: item.script,
    fullText: item.fullText,
    images: item.images || [],
  };
};

const mapNarrationsWithLatestAudio = async (narrations) => {
  const narrationIds = narrations.map((item) => item._id);
  const audioAssets = await AudioAsset.find({ narration: { $in: narrationIds } }).sort({ updatedAt: -1 });
  const latestByNarration = new Map();

  audioAssets.forEach((asset) => {
    const narrationId = String(asset.narration);
    if (!latestByNarration.has(narrationId)) {
      latestByNarration.set(narrationId, asset);
    }
  });

  return narrations.map((item) => mapNarration(item, latestByNarration.get(String(item._id)) || null));
};

router.post('/admin', verifyAccessToken, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const payload = buildNarrationPayload(req.body);
    const created = await Narration.create({
      poi: payload.poi,
      language: payload.language,
      title: payload.title,
      script: payload.script,
      shortText: payload.shortText,
      fullText: payload.fullText,
      images: payload.images,
      status: payload.status,
      submittedBy: req.user?.userId,
    });

    const hydrated = await Narration.findById(created._id).populate('poi', 'name');
    return res.status(201).json({ data: mapNarration(hydrated, null) });
  } catch (error) {
    return next(error);
  }
});

router.put('/admin/:narrationId', verifyAccessToken, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const narration = await Narration.findById(req.params.narrationId);
    if (!narration) {
      return res.status(404).json({ message: 'Narration not found' });
    }

    const payload = buildNarrationPayload(req.body, narration);

    narration.poi = payload.poi;
    narration.language = payload.language;
    narration.title = payload.title;
    narration.script = payload.script;
    narration.shortText = payload.shortText;
    narration.fullText = payload.fullText;
    narration.images = payload.images;
    narration.status = payload.status;

    await narration.save();
    const hydrated = await Narration.findById(narration._id).populate('poi', 'name');
    const audioAsset = await AudioAsset.findOne({ narration: narration._id }).sort({ updatedAt: -1 });
    return res.status(200).json({ data: mapNarration(hydrated, audioAsset) });
  } catch (error) {
    return next(error);
  }
});

router.get('/audio-assets', verifyAccessToken, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const narrations = await Narration.find().populate('poi', 'name').sort({ updatedAt: -1 });

    const data = narrations.map((item) => {
      let status = 'pending';
      if (item.status === 'approved') status = 'completed';
      if (item.status === 'rejected') status = 'failed';
      if (item.status === 'revision_requested') status = 'processing';

      return {
        id: String(item._id),
        target: `${item.poi?.name || 'POI'} / ${item.title}`,
        language: String(item.language || '').slice(0, 2) || 'vi',
        voice: 'Female (Nữ Nam)',
        status,
        duration: `${Math.max(1, Math.ceil(String(item.script || '').split(/\s+/).filter(Boolean).length / 120))}:00`,
        audioUrl: status === 'completed' ? `/api/narrations/${String(item._id)}/audio.mp3` : null,
      };
    });

    return res.status(200).json({ data });
  } catch (error) {
    return next(error);
  }
});

router.get('/admin', verifyAccessToken, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const narrations = await Narration.find().populate('poi', 'name').sort({ updatedAt: -1 });
    return res.status(200).json({ data: await mapNarrationsWithLatestAudio(narrations) });
  } catch (error) {
    return next(error);
  }
});

router.get('/admin/:narrationId', verifyAccessToken, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const narration = await Narration.findById(req.params.narrationId).populate('poi', 'name');
    if (!narration) {
      return res.status(404).json({ message: 'Narration not found' });
    }

    const audioAsset = await AudioAsset.findOne({ narration: narration._id }).sort({ updatedAt: -1 });
    return res.status(200).json({ data: mapNarration(narration, audioAsset) });
  } catch (error) {
    return next(error);
  }
});

router.delete('/:narrationId', verifyAccessToken, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const narration = await Narration.findById(req.params.narrationId);
    if (!narration) {
      return res.status(404).json({ message: 'Narration not found' });
    }

    await Narration.deleteOne({ _id: narration._id });
    return res.status(200).json({ message: 'Narration deleted successfully' });
  } catch (error) {
    return next(error);
  }
});

router.get('/admin/content/pending', verifyAccessToken, requireRole('ADMIN'), validateFetchContentQuery, async (req, res, next) => {
  try {
    const data = await fetchContentSubmissions(req.query);
    return res.status(200).json(data);
  } catch (error) {
    return next(error);
  }
});

router.post('/admin/audio/batch-generate', verifyAccessToken, requireRole('ADMIN'), validateBatchGenerateAudioPayload, async (req, res, next) => {
  try {
    const data = await queueBatchGeneration({
      requestedBy: req.user?.userId,
      status: req.body?.status || 'pending',
    });

    return res.status(200).json(data);
  } catch (error) {
    return next(error);
  }
});

router.get('/admin/audio/jobs', verifyAccessToken, requireRole('ADMIN'), async (req, res, next) => {
  try {
    return res.status(200).json(listBatchJobs());
  } catch (error) {
    return next(error);
  }
});

router.post('/admin/audio/jobs/:jobId/cancel', verifyAccessToken, requireRole('ADMIN'), validateCancelAudioJobPayload, async (req, res, next) => {
  try {
    const data = await cancelBatchJob({ jobId: req.params.jobId });
    return res.status(200).json(data);
  } catch (error) {
    return next(error);
  }
});

router.post('/admin/content/:submissionId/approve', verifyAccessToken, requireRole('ADMIN'), validateApproveContentPayload, async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      reviewerId: req.user?.userId,
      reviewerName: req.user?.fullName,
    };

    const data = await approveContentSubmission(req.params.submissionId, payload);
    return res.status(200).json(data);
  } catch (error) {
    return next(error);
  }
});

router.post('/admin/content/:submissionId/revision', verifyAccessToken, requireRole('ADMIN'), validateRevisionPayload, async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      reviewerId: req.user?.userId,
      reviewerName: req.user?.fullName,
    };

    const data = await requestRevisionForContent(req.params.submissionId, payload);
    return res.status(200).json(data);
  } catch (error) {
    return next(error);
  }
});

router.post('/admin/content/:submissionId/reject', verifyAccessToken, requireRole('ADMIN'), validateRejectContentPayload, async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      reviewerId: req.user?.userId,
      reviewerName: req.user?.fullName,
    };

    const data = await rejectContentSubmission(req.params.submissionId, payload);
    return res.status(200).json(data);
  } catch (error) {
    return next(error);
  }
});

router.get('/', verifyAccessToken, requireRole('ADMIN', 'OWNER'), (req, res) => {
  return res.status(200).json({
    message: 'Narrations router online',
  });
});

module.exports = router;
