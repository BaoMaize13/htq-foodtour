const { body, param, query } = require('express-validator');
const validateRequest = require('../../../middlewares/validate-request.middleware');

const POI_STATUS = ['draft', 'active', 'hidden'];

const validateListPOIQuery = [
  query('query').optional().isString().isLength({ max: 120 }).withMessage('Query is too long'),
  query('status').optional().isIn(POI_STATUS).withMessage('Status filter is invalid'),
  query('page').optional().isInt({ min: 1, max: 100000 }).withMessage('Page must be >= 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  validateRequest,
];

const validateCreatePOI = [
  body('name').isString().isLength({ min: 2, max: 150 }).withMessage('Name must be 2-150 characters'),
  body('shortDescription').isString().isLength({ min: 10, max: 300 }).withMessage('Short description must be 10-300 characters'),
  body('fullDescription').isString().isLength({ min: 20, max: 5000 }).withMessage('Full description must be 20-5000 characters'),
  body('address').optional({ nullable: true, checkFalsy: true }).isString().isLength({ min: 5, max: 255 }).withMessage('Address must be 5-255 characters'),
  body('images').optional().isArray().withMessage('Images must be an array'),
  body('images.*').optional().isString().isLength({ min: 1, max: 2000 }).withMessage('Image URL is invalid'),
  body('lat').isFloat({ min: -90, max: 90 }).withMessage('Latitude is invalid'),
  body('lng').isFloat({ min: -180, max: 180 }).withMessage('Longitude is invalid'),
  body('geofenceRadius').isFloat({ min: 10, max: 5000 }).withMessage('Geofence radius is invalid'),
  body('audioPriority').optional().isInt({ min: 0, max: 10 }).withMessage('Audio priority must be between 0 and 10'),
  body('status').optional().isIn(POI_STATUS).withMessage('Status is invalid'),
  body('category').isMongoId().withMessage('Category id is required and must be valid'),
  body('ownerProfile').optional().isMongoId().withMessage('Owner profile id is invalid'),
  validateRequest,
];

const validateUpdatePOI = [
  param('poiId').isMongoId().withMessage('POI id is invalid'),
  body('name').optional().isString().isLength({ min: 2, max: 150 }).withMessage('Name must be 2-150 characters'),
  body('shortDescription').optional().isString().isLength({ min: 10, max: 300 }).withMessage('Short description must be 10-300 characters'),
  body('fullDescription').optional().isString().isLength({ min: 20, max: 5000 }).withMessage('Full description must be 20-5000 characters'),
  body('address').optional().isString().isLength({ min: 5, max: 255 }).withMessage('Address must be 5-255 characters'),
  body('images').optional().isArray().withMessage('Images must be an array'),
  body('images.*').optional().isString().isLength({ min: 1, max: 2000 }).withMessage('Image URL is invalid'),
  body('lat').optional().isFloat({ min: -90, max: 90 }).withMessage('Latitude is invalid'),
  body('lng').optional().isFloat({ min: -180, max: 180 }).withMessage('Longitude is invalid'),
  body('geofenceRadius').optional().isFloat({ min: 10, max: 5000 }).withMessage('Geofence radius is invalid'),
  body('audioPriority').optional().isInt({ min: 0, max: 10 }).withMessage('Audio priority must be between 0 and 10'),
  body('status').optional().isIn(POI_STATUS).withMessage('Status is invalid'),
  body('category').optional().isMongoId().withMessage('Category id is invalid'),
  validateRequest,
];

const validateDeletePOI = [
  param('poiId').isMongoId().withMessage('POI id is invalid'),
  validateRequest,
];

module.exports = {
  validateListPOIQuery,
  validateCreatePOI,
  validateUpdatePOI,
  validateDeletePOI,
};