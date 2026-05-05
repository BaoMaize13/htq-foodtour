const mongoose = require('mongoose');

const liveSessionSchema = new mongoose.Schema(
    {
        installationId: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },

        appSessionId: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            index: true,
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
            index: true,
        },

        isAuthenticated: {
            type: Boolean,
            default: false,
            index: true,
        },

        platform: {
            type: String,
            trim: true,
            default: '',
        },

        appVersion: {
            type: String,
            trim: true,
            default: '',
        },

        language: {
            type: String,
            trim: true,
            default: 'vi',
        },

        startedAt: {
            type: Date,
            default: Date.now,
            index: true,
        },

        lastSeenAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

liveSessionSchema.index({ lastSeenAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 });

const LiveSession =
    mongoose.models.LiveSession || mongoose.model('LiveSession', liveSessionSchema);

module.exports = LiveSession;