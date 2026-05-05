const errorHandler = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  let statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 500;
  let message = error.message;

  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(error.errors || {})
      .map((item) => item.message)
      .join(', ') || 'Validation failed';
  }

  if (error.code === 11000) {
    statusCode = 409;
    const duplicateFields = Object.keys(error.keyPattern || {});
    message = duplicateFields.length > 0 ? `${duplicateFields.join(', ')} already exists` : 'Duplicate key error';
  }

  console.error('Unhandled application error:', error.message);

  return res.status(statusCode).json({
    status: 'error',
    message: statusCode === 500 ? 'Internal server error' : message,
  });
};

module.exports = errorHandler;
