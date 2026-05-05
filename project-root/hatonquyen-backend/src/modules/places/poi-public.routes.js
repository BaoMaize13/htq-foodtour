const express = require('express');

const verifyAccessToken = require('../../middlewares/verify-access-token.middleware');
const optionalAccessToken = require('../../middlewares/optional-access-token.middleware');

const {
    addPoiFavorite,
    getPublicPOIById,
    getPublicPoiAudio,
    listFavoritePOIs,
    listPoiMenuItems,
    listPoiReviews,
    listPublicPOIs,
    removePoiFavorite,
} = require('./services/poi-public.service');

const router = express.Router();

const getAuthUserId = (req) => {
    return (
        req.user?.userId ||
        req.user?.id ||
        req.user?._id ||
        req.user?.sub ||
        req.auth?.userId ||
        req.auth?.id ||
        req.auth?._id ||
        req.auth?.sub ||
        null
    );
};

router.get('/', optionalAccessToken, async (req, res, next) => {
    try {
        const data = await listPublicPOIs({
            userId: getAuthUserId(req),
            filters: req.query,
        });

        return res.status(200).json(data);
    } catch (error) {
        return next(error);
    }
});

router.get('/favorites', verifyAccessToken, async (req, res, next) => {
    try {
        const userId = getAuthUserId(req);

        if (!userId) {
            return res.status(401).json({
                message: 'User id not found in access token',
            });
        }

        const data = await listFavoritePOIs({
            userId,
            filters: req.query,
        });

        return res.status(200).json(data);
    } catch (error) {
        return next(error);
    }
});

router.get('/:poiId/menu', optionalAccessToken, async (req, res, next) => {
    try {
        const data = await listPoiMenuItems({
            poiId: req.params.poiId,
            filters: req.query,
        });

        return res.status(200).json(data);
    } catch (error) {
        return next(error);
    }
});

router.get('/:poiId/reviews', optionalAccessToken, async (req, res, next) => {
    try {
        const data = await listPoiReviews({
            poiId: req.params.poiId,
        });

        return res.status(200).json(data);
    } catch (error) {
        return next(error);
    }
});

router.get('/:poiId/audio', optionalAccessToken, async (req, res, next) => {
    try {
        const data = await getPublicPoiAudio({
            poiId: req.params.poiId,
            filters: req.query,
        });

        return res.status(200).json({
            data,
        });
    } catch (error) {
        return next(error);
    }
});

router.post('/:poiId/favorite', verifyAccessToken, async (req, res, next) => {
    try {
        const userId = getAuthUserId(req);

        if (!userId) {
            return res.status(401).json({
                message: 'User id not found in access token',
            });
        }

        const data = await addPoiFavorite({
            userId,
            poiId: req.params.poiId,
        });

        return res.status(200).json(data);
    } catch (error) {
        return next(error);
    }
});

router.delete('/:poiId/favorite', verifyAccessToken, async (req, res, next) => {
    try {
        const userId = getAuthUserId(req);

        if (!userId) {
            return res.status(401).json({
                message: 'User id not found in access token',
            });
        }

        const data = await removePoiFavorite({
            userId,
            poiId: req.params.poiId,
        });

        return res.status(200).json(data);
    } catch (error) {
        return next(error);
    }
});

router.get('/:poiId', optionalAccessToken, async (req, res, next) => {
    try {
        const data = await getPublicPOIById({
            poiId: req.params.poiId,
            userId: getAuthUserId(req),
            filters: req.query,
        });

        return res.status(200).json({ data });
    } catch (error) {
        return next(error);
    }
});

module.exports = router;
