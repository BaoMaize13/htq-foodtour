const mongoose = require('mongoose');

const USER_STATUS = ['pending', 'active', 'blocked'];
const USER_ROLE_ENUM = ['admin', 'moderator', 'editor', 'user', 'owner'];
const USER_ACCOUNT_STATUS = ['active', 'suspended'];

const SUPPORTED_LANGUAGES = [
    'vi',
    'en',
    'ko',
    'ja',
    'zh-Hans',
    'zh-Hant',
    'es',
    'de',
    'fr',
    'ru',
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 120,
        },

        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            unique: true,
            validate: {
                validator: (value) => EMAIL_REGEX.test(value),
                message: 'Invalid email format',
            },
        },

        username: {
            type: String,
            trim: true,
            lowercase: true,
            unique: true,
            sparse: true,
            minlength: 3,
            maxlength: 60,
        },

        passwordHash: {
            type: String,
            required: true,
            trim: true,
            minlength: 20,
            select: false,
        },

        role: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Role',
            required: true,
            index: true,
        },

        roleCode: {
            type: String,
            enum: USER_ROLE_ENUM,
            default: 'user',
            index: true,
        },

        accountStatus: {
            type: String,
            enum: USER_ACCOUNT_STATUS,
            default: 'active',
            index: true,
        },

        status: {
            type: String,
            enum: USER_STATUS,
            default: 'active',
            index: true,
        },

        phone: {
            type: String,
            trim: true,
            default: null,
            maxlength: 20,
        },

        preferredLanguage: {
            type: String,
            enum: SUPPORTED_LANGUAGES,
            default: 'vi',
            index: true,
        },

        lastLogin: {
            type: Date,
            default: null,
        },

        passwordResetTokenHash: {
            type: String,
            default: null,
            index: true,
        },

        passwordResetExpiresAt: {
            type: Date,
            default: null,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;
