const ONLINE_TTL_MS = 30 * 1000;
const CLEANUP_INTERVAL_MS = 10 * 1000;

const activeDeviceSessions = new Map();

const normalizeDeviceId = (value) => {
    if (value === null || value === undefined) {
        return '';
    }

    return String(value).trim();
};

const assertDeviceId = (deviceId) => {
    const normalizedDeviceId = normalizeDeviceId(deviceId);

    if (!normalizedDeviceId) {
        const error = new Error('deviceId is required');
        error.statusCode = 400;
        error.code = 'DEVICE_ID_REQUIRED';
        throw error;
    }

    return normalizedDeviceId;
};

const touchDeviceSession = (deviceId) => {
    const normalizedDeviceId = assertDeviceId(deviceId);
    const now = Date.now();

    activeDeviceSessions.set(normalizedDeviceId, now);

    return {
        deviceId: normalizedDeviceId,
        lastActiveAt: new Date(now).toISOString(),
        liveCount: activeDeviceSessions.size,
    };
};

const removeDeviceSession = (deviceId) => {
    const normalizedDeviceId = assertDeviceId(deviceId);
    const removed = activeDeviceSessions.delete(normalizedDeviceId);

    return {
        deviceId: normalizedDeviceId,
        removed,
        liveCount: activeDeviceSessions.size,
    };
};

const cleanupExpiredSessions = () => {
    const threshold = Date.now() - ONLINE_TTL_MS;
    let removed = 0;

    for (const [deviceId, lastActiveTimestamp] of activeDeviceSessions.entries()) {
        if (lastActiveTimestamp < threshold) {
            activeDeviceSessions.delete(deviceId);
            removed += 1;
        }
    }

    return removed;
};

const getLiveCount = () => {
    cleanupExpiredSessions();
    return activeDeviceSessions.size;
};

const getLiveSessionsSnapshot = () => {
    cleanupExpiredSessions();

    return Array.from(activeDeviceSessions.entries()).map(([deviceId, lastActiveTimestamp]) => ({
        deviceId,
        lastActiveAt: new Date(lastActiveTimestamp).toISOString(),
    }));
};

const cleanupTimer = setInterval(cleanupExpiredSessions, CLEANUP_INTERVAL_MS);

if (typeof cleanupTimer.unref === 'function') {
    cleanupTimer.unref();
}

module.exports = {
    CLEANUP_INTERVAL_MS,
    ONLINE_TTL_MS,
    cleanupExpiredSessions,
    getLiveCount,
    getLiveSessionsSnapshot,
    removeDeviceSession,
    touchDeviceSession,
};
