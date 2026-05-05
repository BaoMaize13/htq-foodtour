const { verifyAccessToken } = require('../utils/jwt.util');

const getBearerToken = (authorizationHeader) => {
  if (!authorizationHeader || typeof authorizationHeader !== 'string') {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(' ');

  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') {
    return null;
  }

  return token;
};

const optionalAccessTokenMiddleware = (req, res, next) => {
  const token = getBearerToken(req.headers.authorization);

  if (!token) {
    return next();
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    req.auth = payload;
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Access token expired',
      });
    }

    return res.status(401).json({
      message: 'Invalid access token',
    });
  }
};

module.exports = optionalAccessTokenMiddleware;
