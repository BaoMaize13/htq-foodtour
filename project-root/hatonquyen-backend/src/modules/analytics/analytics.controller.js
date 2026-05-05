const User = require('../users/models/user.model');
const LiveSession = require('./models/live-session.model');
const liveSessionService = require('./services/live-session.service');

const ONLINE_WINDOW_MS = 2 * 60 * 1000;
const DAYS_IN_GROWTH_WINDOW = 180;
const MONTHS_IN_GROWTH_WINDOW = 6;

const getAuthUserId = (authUser) => {
    return (
        authUser?.id ||
        authUser?._id ||
        authUser?.userId ||
        authUser?.sub ||
        null
    );
};

const normalizeLanguage = (value) => {
    if (!value || typeof value !== 'string') {
        return 'vi';
    }

    return value.trim();
};

const getRequestDeviceId = (body = {}) => {
    return (
        body.deviceId ||
        body.DeviceId ||
        body.installationId ||
        body.InstallationId ||
        body.appSessionId ||
        body.AppSessionId ||
        ''
    );
};

const getBodyValue = (body = {}, ...keys) => {
    for (const key of keys) {
        const value = body?.[key];

        if (value !== undefined && value !== null && String(value).trim()) {
            return String(value).trim();
        }
    }

    return '';
};

const buildDeviceIdErrorResponse = (res, error) => {
    if (error?.code === 'DEVICE_ID_REQUIRED' || error?.statusCode === 400) {
        return res.status(400).json({
            code: 'DEVICE_ID_REQUIRED',
            message: 'deviceId is required',
        });
    }

    return null;
};

const toUtcDateKey = (date) => date.toISOString().slice(0, 10);
const toUtcMonthKey = (date) => date.toISOString().slice(0, 7);

const startOfUtcDay = (date) =>
    new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const startOfUtcMonth = (date) =>
    new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));

const addUtcDays = (date, days) => {
    const nextDate = new Date(date);
    nextDate.setUTCDate(nextDate.getUTCDate() + days);
    return nextDate;
};

const addUtcMonths = (date, months) => {
    const nextDate = new Date(date);
    nextDate.setUTCMonth(nextDate.getUTCMonth() + months);
    return nextDate;
};

const getGrowthWindow = (groupBy) => {
    const now = new Date();

    if (groupBy === 'month') {
        const currentMonthStart = startOfUtcMonth(now);

        return {
            startDate: addUtcMonths(currentMonthStart, -(MONTHS_IN_GROWTH_WINDOW - 1)),
            endDate: currentMonthStart,
        };
    }

    const todayStart = startOfUtcDay(now);

    return {
        startDate: addUtcDays(todayStart, -(DAYS_IN_GROWTH_WINDOW - 1)),
        endDate: todayStart,
    };
};

const buildPeriods = (groupBy, startDate, endDate) => {
    const periods = [];
    let cursor = new Date(startDate);

    while (cursor <= endDate) {
        periods.push(groupBy === 'month' ? toUtcMonthKey(cursor) : toUtcDateKey(cursor));
        cursor = groupBy === 'month' ? addUtcMonths(cursor, 1) : addUtcDays(cursor, 1);
    }

    return periods;
};

const startPresence = async (req, res, next) => {
    try {
        const body = req.body || {};

        const installationId = getBodyValue(body, 'installationId', 'InstallationId');
        const appSessionId = getBodyValue(body, 'appSessionId', 'AppSessionId');
        const platform = getBodyValue(body, 'platform', 'Platform');
        const appVersion = getBodyValue(body, 'appVersion', 'AppVersion');
        const language = getBodyValue(body, 'language', 'Language') || 'vi';

        if (!installationId || !appSessionId) {
            return res.status(400).json({
                code: 'INVALID_PRESENCE_PAYLOAD',
                message: 'installationId and appSessionId are required',
            });
        }

        const now = new Date();

        const session = await LiveSession.findOneAndUpdate(
            { appSessionId: String(appSessionId).trim() },
            {
                $setOnInsert: {
                    startedAt: now,
                },
                $set: {
                    installationId: String(installationId).trim(),
                    platform: String(platform || '').trim(),
                    appVersion: String(appVersion || '').trim(),
                    language: normalizeLanguage(language),
                    lastSeenAt: now,
                },
            },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true,
            }
        );

        return res.status(200).json({
            message: 'Presence started',
            data: {
                appSessionId: session.appSessionId,
                installationId: session.installationId,
                isAuthenticated: session.isAuthenticated,
                lastSeenAt: session.lastSeenAt,
            },
        });
    } catch (error) {
        return next(error);
    }
};

const heartbeatPresence = async (req, res, next) => {
    try {
        const appSessionId = getBodyValue(req.body || {}, 'appSessionId', 'AppSessionId');

        if (!appSessionId) {
            return res.status(400).json({
                code: 'INVALID_PRESENCE_PAYLOAD',
                message: 'appSessionId is required',
            });
        }

        const session = await LiveSession.findOneAndUpdate(
            { appSessionId: String(appSessionId).trim() },
            {
                $set: {
                    lastSeenAt: new Date(),
                },
            },
            {
                new: true,
            }
        );

        if (!session) {
            return res.status(404).json({
                code: 'LIVE_SESSION_NOT_FOUND',
                message: 'Live session not found',
            });
        }

        return res.status(200).json({
            message: 'Heartbeat received',
            data: {
                appSessionId: session.appSessionId,
                lastSeenAt: session.lastSeenAt,
            },
        });
    } catch (error) {
        return next(error);
    }
};

const identifyPresence = async (req, res, next) => {
    try {
        const userId = getAuthUserId(req.user);

        if (!userId) {
            return res.status(401).json({
                code: 'AUTH_USER_NOT_FOUND',
                message: 'Authenticated user not found',
            });
        }

        const appSessionId = getBodyValue(req.body || {}, 'appSessionId', 'AppSessionId');

        if (!appSessionId) {
            return res.status(400).json({
                code: 'INVALID_PRESENCE_PAYLOAD',
                message: 'appSessionId is required',
            });
        }

        const session = await LiveSession.findOneAndUpdate(
            { appSessionId: String(appSessionId).trim() },
            {
                $set: {
                    userId,
                    isAuthenticated: true,
                    lastSeenAt: new Date(),
                },
            },
            {
                new: true,
            }
        );

        if (!session) {
            return res.status(404).json({
                code: 'LIVE_SESSION_NOT_FOUND',
                message: 'Live session not found',
            });
        }

        return res.status(200).json({
            message: 'Presence identified successfully',
            data: {
                appSessionId: session.appSessionId,
                installationId: session.installationId,
                userId: String(session.userId || ''),
                isAuthenticated: session.isAuthenticated,
                lastSeenAt: session.lastSeenAt,
            },
        });
    } catch (error) {
        return next(error);
    }
};

const getOnlineNowStats = async (req, res, next) => {
    try {
        const threshold = new Date(Date.now() - ONLINE_WINDOW_MS);

        const [onlineNowInstallationIds, loggedInInstallationIds, guestInstallationIds] = await Promise.all([
            LiveSession.distinct('installationId', {
                lastSeenAt: { $gte: threshold },
            }),
            LiveSession.distinct('installationId', {
                lastSeenAt: { $gte: threshold },
                isAuthenticated: true,
                userId: { $ne: null },
            }),
            LiveSession.distinct('installationId', {
                lastSeenAt: { $gte: threshold },
                $or: [
                    { isAuthenticated: false },
                    { userId: null },
                ],
            }),
        ]);

        return res.status(200).json({
            message: 'Online statistics fetched successfully',
            data: {
                onlineNow: onlineNowInstallationIds.length,
                loggedInOnline: loggedInInstallationIds.length,
                guestOnline: guestInstallationIds.length,
                onlineWindowSeconds: ONLINE_WINDOW_MS / 1000,
            },
        });
    } catch (error) {
        return next(error);
    }
};

const getUsersGrowth = async (req, res, next) => {
    try {
        const groupBy = req.query.groupBy === 'day' ? 'day' : 'month';
        const { startDate, endDate } = getGrowthWindow(groupBy);
        const dateFormat = groupBy === 'month' ? '%Y-%m' : '%Y-%m-%d';

        const [previousUsersCount, totalUsers, groupedUsers] = await Promise.all([
            User.countDocuments({
                createdAt: {
                    $lt: startDate,
                },
            }),
            User.countDocuments(),
            User.aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: startDate,
                        },
                    },
                },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: dateFormat,
                                date: '$createdAt',
                            },
                        },
                        newUsers: {
                            $sum: 1,
                        },
                    },
                },
                {
                    $sort: {
                        _id: 1,
                    },
                },
            ]),
        ]);

        const groupedUsersByPeriod = new Map(
            groupedUsers.map((item) => [item._id, item.newUsers])
        );

        let runningTotal = previousUsersCount;

        const points = buildPeriods(groupBy, startDate, endDate).map((period) => {
            const newUsers = groupedUsersByPeriod.get(period) || 0;
            runningTotal += newUsers;

            return {
                period,
                newUsers,
                totalUsers: runningTotal,
            };
        });

        return res.status(200).json({
            message: 'Users growth fetched successfully',
            data: {
                groupBy,
                from: startDate.toISOString(),
                to: new Date().toISOString(),
                totalUsers,
                points,
            },
        });
    } catch (error) {
        return next(error);
    }
};

const postHeartbeat = async (req, res, next) => {
    try {
        const session = liveSessionService.touchDeviceSession(getRequestDeviceId(req.body));

        return res.status(200).json({
            message: 'Heartbeat received',
            data: {
                ...session,
                ttlSeconds: liveSessionService.ONLINE_TTL_MS / 1000,
            },
        });
    } catch (error) {
        const response = buildDeviceIdErrorResponse(res, error);

        if (response) {
            return response;
        }

        return next(error);
    }
};

const postDisconnect = async (req, res, next) => {
    try {
        const session = liveSessionService.removeDeviceSession(getRequestDeviceId(req.body));

        return res.status(200).json({
            message: 'Device disconnected',
            data: session,
        });
    } catch (error) {
        const response = buildDeviceIdErrorResponse(res, error);

        if (response) {
            return response;
        }

        return next(error);
    }
};

const getLiveCount = async (req, res, next) => {
    try {
        const threshold = new Date(Date.now() - ONLINE_WINDOW_MS);

        const [onlineNowInstallationIds, loggedInInstallationIds, guestInstallationIds] = await Promise.all([
            LiveSession.distinct('installationId', {
                lastSeenAt: { $gte: threshold },
            }),
            LiveSession.distinct('installationId', {
                lastSeenAt: { $gte: threshold },
                isAuthenticated: true,
                userId: { $ne: null },
            }),
            LiveSession.distinct('installationId', {
                lastSeenAt: { $gte: threshold },
                $or: [
                    { isAuthenticated: false },
                    { userId: null },
                ],
            }),
        ]);

        return res.status(200).json({
            message: 'Live users count fetched successfully',
            data: {
                liveUsers: onlineNowInstallationIds.length,
                liveCount: onlineNowInstallationIds.length,
                onlineNow: onlineNowInstallationIds.length,
                loggedInOnline: loggedInInstallationIds.length,
                guestOnline: guestInstallationIds.length,
                onlineWindowSeconds: ONLINE_WINDOW_MS / 1000,

                // Giữ lại số cũ từ Map RAM để không làm vỡ web cũ nếu còn dùng legacy heartbeat.
                legacyLiveUsers: liveSessionService.getLiveCount(),
            },
        });
    } catch (error) {
        return next(error);
    }
};

module.exports = {
    getLiveCount,
    getOnlineNowStats,
    getUsersGrowth,
    heartbeatPresence,
    identifyPresence,
    postDisconnect,
    postHeartbeat,
    startPresence,
};