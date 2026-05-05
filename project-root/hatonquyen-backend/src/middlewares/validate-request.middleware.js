const { validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
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

module.exports = validateRequest;
