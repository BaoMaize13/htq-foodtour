const express = require('express');

const verifyAccessToken = require('../../middlewares/verify-access-token.middleware');
const requireRole = require('../../middlewares/require-role.middleware');

const {
    getLiveCount,
    getOnlineNowStats,
    getUsersGrowth,
    heartbeatPresence,
    identifyPresence,
    postDisconnect,
    postHeartbeat,
    startPresence,
} = require('./analytics.controller');

const router = express.Router();

// Mobile/app-rule presence API
router.post('/presence/start', startPresence);
router.post('/presence/heartbeat', heartbeatPresence);
router.post('/presence/identify', verifyAccessToken, identifyPresence);
router.get('/presence/online-now', verifyAccessToken, requireRole('ADMIN'), getOnlineNowStats);

// Web/admin live analytics API
router.post('/heartbeat', postHeartbeat);
router.post('/disconnect', postDisconnect);
router.get('/live-count', verifyAccessToken, requireRole('ADMIN'), getLiveCount);
router.get('/users-growth', verifyAccessToken, requireRole('ADMIN'), getUsersGrowth);

module.exports = router;
