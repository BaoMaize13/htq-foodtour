const { body, param, query } = require('express-validator');
const validateRequest = require('../../../middlewares/validate-request.middleware');

const CONTENT_STATUS = ['pending', 'approved', 'revision_requested', 'rejected', 'draft'];
const LANGUAGES = ['vi', 'en', 'zh', 'ja', 'fr'];

const validateFetchContentQuery = [
  query('query').optional().isString().isLength({ max: 120 }).withMessage('Query is too long'),
  query('status').optional().isIn(CONTENT_STATUS).withMessage('Status filter is invalid'),
  query('language').optional().isIn(LANGUAGES).withMessage('Language filter is invalid'),
  query('page').optional().isInt({ min: 1, max: 100000 }).withMessage('Page must be >= 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  validateRequest,
];

const validateBatchGenerateAudioPayload = [
  body('status').optional().isIn(CONTENT_STATUS).withMessage('Status filter for batch generation is invalid'),
  validateRequest,
];

const validateCancelAudioJobPayload = [
  param('jobId').isString().isLength({ min: 8, max: 120 }).withMessage('Audio job id is invalid'),
  validateRequest,
];

const validateApproveContentPayload = [
  param('submissionId').isMongoId().withMessage('Submission id is invalid'),
  body('note').optional().isString().isLength({ max: 1000 }).withMessage('Moderation note is too long'),
  validateRequest,
];

const validateRevisionPayload = [
  param('submissionId').isMongoId().withMessage('Submission id is invalid'),
  body('message').isString().isLength({ min: 12, max: 1000 }).withMessage('Revision message must be 12-1000 characters'),
  validateRequest,
];

const validateRejectContentPayload = [
  param('submissionId').isMongoId().withMessage('Submission id is invalid'),
  body('reason').isString().isLength({ min: 12, max: 1000 }).withMessage('Reject reason must be 12-1000 characters'),
  validateRequest,
];

module.exports = {
  validateFetchContentQuery,
  validateBatchGenerateAudioPayload,
  validateCancelAudioJobPayload,
  validateApproveContentPayload,
  validateRevisionPayload,
  validateRejectContentPayload,
};
