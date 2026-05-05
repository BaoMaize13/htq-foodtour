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

const verifyAccessTokenMiddleware = (req, res, next) => {
    const token = getBearerToken(req.headers.authorization);

    if (!token) {
        return res.status(401).json({
            code: 'ACCESS_TOKEN_REQUIRED',
            message: 'Access token is required',
        });
    }

    try {
        const payload = verifyAccessToken(token);

        req.user = payload;
        req.auth = payload;

        return next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                code: 'ACCESS_TOKEN_EXPIRED',
                message: 'Access token expired',
            });
        }

        return res.status(401).json({
            code: 'INVALID_ACCESS_TOKEN',
            message: 'Invalid access token',
        });
    }
};

module.exports = verifyAccessTokenMiddleware;