const express = require('express');

const verifyAccessToken = require('../../middlewares/verify-access-token.middleware');
const requireRole = require('../../middlewares/require-role.middleware');

const {
    validateLoginPayload,
    validateRegisterOwnerPayload,
} = require('./validators/auth.validators');

const {
    validateFetchOwnerApplicationsQuery,
    validateApproveOwnerPayload,
    validateRejectOwnerPayload,
} = require('./validators/admin-owner-approval.validators');

const {
    login,
    registerOwnerAccount,
    updateCurrentUserProfile,
    getCurrentUserPreferences,
    updateCurrentUserPreferredLanguage,
    changeCurrentUserPassword,
    forgotUserPassword,
    resetUserPassword,
} = require('./controllers/auth.controller');

const {
    fetchOwnerApplications,
    approveOwnerApplication,
    rejectOwnerApplication,
} = require('./services/admin-owner-approval.service');

const router = express.Router();

router.post('/login', validateLoginPayload, login);

router.post('/register-owner', validateRegisterOwnerPayload, registerOwnerAccount);

router.put('/me', verifyAccessToken, updateCurrentUserProfile);

router.get('/me/preferences', verifyAccessToken, getCurrentUserPreferences);

router.patch(
    '/me/preferences/language',
    verifyAccessToken,
    updateCurrentUserPreferredLanguage
);

router.post('/change-password', verifyAccessToken, changeCurrentUserPassword);

router.post('/forgot-password', forgotUserPassword);

router.post('/reset-password', resetUserPassword);

router.get(
    '/admin/owners/pending',
    verifyAccessToken,
    requireRole('ADMIN'),
    validateFetchOwnerApplicationsQuery,
    async (req, res, next) => {
        try {
            const data = await fetchOwnerApplications(req.query);

            return res.status(200).json(data);
        } catch (error) {
            return next(error);
        }
    }
);

router.post(
    '/admin/owners/:ownerProfileId/approve',
    verifyAccessToken,
    requireRole('ADMIN'),
    validateApproveOwnerPayload,
    async (req, res, next) => {
        try {
            const data = await approveOwnerApplication(
                req.params.ownerProfileId,
                req.body
            );

            return res.status(200).json(data);
        } catch (error) {
            return next(error);
        }
    }
);

router.post(
    '/admin/owners/:ownerProfileId/reject',
    verifyAccessToken,
    requireRole('ADMIN'),
    validateRejectOwnerPayload,
    async (req, res, next) => {
        try {
            const data = await rejectOwnerApplication(
                req.params.ownerProfileId,
                req.body
            );

            return res.status(200).json(data);
        } catch (error) {
            return next(error);
        }
    }
);

router.get(
    '/authz-test/admin',
    verifyAccessToken,
    requireRole('ADMIN'),
    (req, res) => {
        return res.status(200).json({
            message: 'Admin access granted',
        });
    }
);

router.get(
    '/authz-test/owner',
    verifyAccessToken,
    requireRole('OWNER'),
    (req, res) => {
        return res.status(200).json({
            message: 'Owner access granted',
        });
    }
);

router.get(
    '/authz-test/admin-or-owner',
    verifyAccessToken,
    requireRole('ADMIN', 'OWNER'),
    (req, res) => {
        return res.status(200).json({
            message: 'Admin or owner access granted',
        });
    }
);

router.get('/', (req, res) => {
    return res.status(200).json({
        message: 'Users router placeholder',
    });
});

module.exports = router;