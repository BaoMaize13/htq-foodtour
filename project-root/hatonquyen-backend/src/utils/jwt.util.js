const jwt = require('jsonwebtoken');

const DEFAULT_ACCESS_TOKEN_EXPIRES_IN = '15m';
const DEV_FALLBACK_ACCESS_SECRET = 'dev_jwt_access_secret_change_me';
let hasWarnedFallbackSecret = false;

const getAccessTokenSecret = () => {
  const secret = process.env.JWT_ACCESS_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_ACCESS_SECRET is not configured');
  }

  if (!hasWarnedFallbackSecret) {
    console.warn('JWT_ACCESS_SECRET is not configured. Using development fallback secret.');
    hasWarnedFallbackSecret = true;
  }

  return DEV_FALLBACK_ACCESS_SECRET;
};

const getAccessTokenExpiresIn = () => process.env.JWT_ACCESS_EXPIRES_IN || DEFAULT_ACCESS_TOKEN_EXPIRES_IN;

const signAccessToken = (payload, options = {}) => {
  return jwt.sign(payload, getAccessTokenSecret(), {
    expiresIn: getAccessTokenExpiresIn(),
    ...options,
  });
};

const verifyAccessToken = (token) => jwt.verify(token, getAccessTokenSecret());

const buildAccessTokenPayload = (user) => {
  const userId = user?._id || user?.id;

  if (!userId) {
    throw new Error('User id is required to build access token payload');
  }

  const roleCode =
    user?.roleCode ||
    user?.role?.code ||
    null;

  return {
    userId: String(userId),
    roleCode,
    fullName: user?.fullName || null,
    email: user?.email || null,
  };
};

module.exports = {
  signAccessToken,
  verifyAccessToken,
  buildAccessTokenPayload,
  getAccessTokenExpiresIn,
};
