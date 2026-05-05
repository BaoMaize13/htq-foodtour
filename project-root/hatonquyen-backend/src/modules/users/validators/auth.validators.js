const { body, validationResult } = require('express-validator');

const handleValidationResult = (req, res, next) => {
  const validation = validationResult(req);

  if (validation.isEmpty()) {
    return next();
  }

  return res.status(400).json({
    status: 'error',
    message: 'Validation failed',
    errors: validation.array().map((item) => ({ field: item.path, message: item.msg })),
  });
};

const validateLoginPayload = [
  body().custom((value) => {
    const account = String(value?.account ?? value?.email ?? '').trim();
    if (!account) {
      throw new Error('Account is required');
    }

    return true;
  }),
  body('password').isString().notEmpty().withMessage('Password is required'),
  handleValidationResult,
];

const validateRegisterOwnerPayload = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('email').trim().isEmail().withMessage('Email is invalid'),
  body('password').isString().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('businessName').trim().notEmpty().withMessage('Business name is required'),
  body('businessAddress').trim().notEmpty().withMessage('Business address is required'),
  body('idCardNumber').trim().notEmpty().withMessage('ID card number is required'),
  handleValidationResult,
];

module.exports = {
  validateLoginPayload,
  validateRegisterOwnerPayload,
};
