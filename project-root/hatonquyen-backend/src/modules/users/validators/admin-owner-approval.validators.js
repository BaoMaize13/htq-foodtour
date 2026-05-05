const { body, param, query } = require('express-validator');
const validateRequest = require('../../../middlewares/validate-request.middleware');

const OWNER_STATUS = ['pending', 'approved', 'rejected'];
const RISK_LEVELS = ['standard', 'attention'];

const validateFetchOwnerApplicationsQuery = [
  query('query').optional().isString().isLength({ max: 120 }).withMessage('Query is too long'),
  query('status').optional().isIn(OWNER_STATUS).withMessage('Status filter is invalid'),
  query('riskLevel').optional().isIn(RISK_LEVELS).withMessage('Risk level filter is invalid'),
  validateRequest,
];

const validateApproveOwnerPayload = [
  param('ownerProfileId').isMongoId().withMessage('Owner profile id is invalid'),
  body('reviewerId').optional().isString().isLength({ min: 2, max: 80 }).withMessage('Reviewer id is invalid'),
  body('reviewerName').optional().isString().isLength({ min: 2, max: 120 }).withMessage('Reviewer name is invalid'),
  body('note').optional().isString().isLength({ max: 500 }).withMessage('Approval note is too long'),
  validateRequest,
];

const validateRejectOwnerPayload = [
  param('ownerProfileId').isMongoId().withMessage('Owner profile id is invalid'),
  body('reviewerId').optional().isString().isLength({ min: 2, max: 80 }).withMessage('Reviewer id is invalid'),
  body('reviewerName').optional().isString().isLength({ min: 2, max: 120 }).withMessage('Reviewer name is invalid'),
  body('reason').isString().isLength({ min: 12, max: 500 }).withMessage('Reject reason must be 12-500 characters'),
  validateRequest,
];

module.exports = {
  validateFetchOwnerApplicationsQuery,
  validateApproveOwnerPayload,
  validateRejectOwnerPayload,
};
