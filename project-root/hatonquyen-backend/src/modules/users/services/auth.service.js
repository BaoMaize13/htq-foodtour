const crypto = require('crypto');
const mongoose = require('mongoose');

const User = require('../models/user.model');
const Role = require('../models/role.model');
const OwnerProfile = require('../models/owner-profile.model');
const { comparePassword, hashPassword } = require('../../../utils/password.util');
const { buildAccessTokenPayload, signAccessToken } = require('../../../utils/jwt.util');

const OWNER_ROLE_CODE = 'OWNER';
const MIN_PASSWORD_LENGTH = 8;
const RESET_TOKEN_TTL_MINUTES = 15;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const createHttpError = (statusCode, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const normalizeText = (value) => String(value || '').trim();
const normalizeEmail = (email) => normalizeText(email).toLowerCase();
const normalizeUsername = (username) => normalizeText(username).toLowerCase();
const hashResetToken = (rawToken) => crypto.createHash('sha256').update(rawToken).digest('hex');

const buildAuthResponse = (user) => ({
    accessToken: signAccessToken(buildAccessTokenPayload(user)),
    user: {
        id: String(user._id),
        fullName: user.fullName,
        email: user.email,
        username: user.username,
        status: user.status,
        phone: user.phone,
        lastLogin: user.lastLogin,
    },
    role: user.role
        ? {
            id: String(user.role._id),
            code: user.role.code,
            name: user.role.name,
        }
        : null,
});

const loginUser = async ({ email, username, account, password }) => {
    const loginName = normalizeText(account || username || email);

    if (!loginName) {
        throw createHttpError(400, 'Account is required');
    }

    if (typeof password !== 'string' || password.length === 0) {
        throw createHttpError(400, 'Password is required');
    }

    const normalizedLoginName = loginName.toLowerCase();
    const query = EMAIL_REGEX.test(normalizedLoginName)
        ? { email: normalizeEmail(normalizedLoginName) }
        : { username: normalizeUsername(normalizedLoginName) };

    const user = await User.findOne(query)
        .select('+passwordHash fullName email username status phone lastLogin role')
        .populate('role', 'name code isActive');

    if (!user) {
        throw createHttpError(401, 'Invalid credentials');
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
        throw createHttpError(401, 'Invalid credentials');
    }

    if (user.status === 'pending') {
        throw createHttpError(403, 'Account pending approval');
    }

    if (user.status === 'blocked') {
        throw createHttpError(403, 'Account is blocked');
    }

    if (user.status !== 'active') {
        throw createHttpError(403, 'Account is not active');
    }

    user.lastLogin = new Date();
    await user.save();

    return buildAuthResponse(user);
};

const validateRegisterOwnerInput = (payload) => {
    const fullName = normalizeText(payload.fullName);
    const email = normalizeEmail(payload.email);
    const password = typeof payload.password === 'string' ? payload.password : '';
    const phone = payload.phone ? normalizeText(payload.phone) : null;
    const businessName = normalizeText(payload.businessName);
    const businessAddress = normalizeText(payload.businessAddress);
    const idCardNumber = normalizeText(payload.idCardNumber);

    if (!fullName) throw createHttpError(400, 'Full name is required');
    if (!EMAIL_REGEX.test(email)) throw createHttpError(400, 'Email is invalid');
    if (!password || password.length < MIN_PASSWORD_LENGTH) {
        throw createHttpError(400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    }
    if (!businessName) throw createHttpError(400, 'Business name is required');
    if (!businessAddress) throw createHttpError(400, 'Business address is required');
    if (!idCardNumber) throw createHttpError(400, 'ID card number is required');

    return { fullName, email, password, phone, businessName, businessAddress, idCardNumber };
};

const createOwnerDocuments = async (input, ownerRole, options = {}) => {
    const passwordHash = await hashPassword(input.password);

    const createdUsers = await User.create(
        [
            {
                fullName: input.fullName,
                email: input.email,
                passwordHash,
                role: ownerRole._id,
                status: 'pending',
                phone: input.phone,
            },
        ],
        options
    );

    const createdUser = createdUsers[0];

    const createdProfiles = await OwnerProfile.create(
        [
            {
                user: createdUser._id,
                businessName: input.businessName,
                businessAddress: input.businessAddress,
                idCardNumber: input.idCardNumber,
                status: 'pending',
                approvedAt: null,
                rejectionReason: null,
            },
        ],
        options
    );

    const ownerProfile = createdProfiles[0];

    return {
        user: {
            id: String(createdUser._id),
            fullName: createdUser.fullName,
            email: createdUser.email,
            phone: createdUser.phone,
            status: createdUser.status,
        },
        role: {
            id: String(ownerRole._id),
            code: ownerRole.code,
            name: ownerRole.name,
        },
        ownerProfile: {
            id: String(ownerProfile._id),
            status: ownerProfile.status,
            submittedAt: ownerProfile.submittedAt,
        },
    };
};

const registerOwnerWithoutTransaction = async (input, ownerRole) => {
    let createdUser;

    try {
        const passwordHash = await hashPassword(input.password);

        createdUser = await User.create({
            fullName: input.fullName,
            email: input.email,
            passwordHash,
            role: ownerRole._id,
            status: 'pending',
            phone: input.phone,
        });

        const ownerProfile = await OwnerProfile.create({
            user: createdUser._id,
            businessName: input.businessName,
            businessAddress: input.businessAddress,
            idCardNumber: input.idCardNumber,
            status: 'pending',
            approvedAt: null,
            rejectionReason: null,
        });

        return {
            user: {
                id: String(createdUser._id),
                fullName: createdUser.fullName,
                email: createdUser.email,
                phone: createdUser.phone,
                status: createdUser.status,
            },
            role: {
                id: String(ownerRole._id),
                code: ownerRole.code,
                name: ownerRole.name,
            },
            ownerProfile: {
                id: String(ownerProfile._id),
                status: ownerProfile.status,
                submittedAt: ownerProfile.submittedAt,
            },
        };
    } catch (error) {
        if (createdUser?._id) {
            await User.deleteOne({ _id: createdUser._id });
        }

        throw error;
    }
};

const isTransactionUnsupportedError = (error) => {
    const message = String(error?.message || '').toLowerCase();
    return (
        message.includes('transaction numbers are only allowed') ||
        message.includes('replica set') ||
        message.includes('sharded cluster')
    );
};

const registerOwner = async (payload) => {
    const input = validateRegisterOwnerInput(payload);

    const existingUser = await User.findOne({ email: input.email }).select('_id');

    if (existingUser) {
        throw createHttpError(409, 'Email already exists');
    }

    const ownerRole = await Role.findOne({ code: OWNER_ROLE_CODE, isActive: true }).select('_id code name');

    if (!ownerRole) {
        throw createHttpError(500, 'Owner role is not configured');
    }

    const session = await mongoose.startSession();

    try {
        let registrationResult;

        await session.withTransaction(async () => {
            registrationResult = await createOwnerDocuments(input, ownerRole, { session });
        });

        return registrationResult;
    } catch (error) {
        if (isTransactionUnsupportedError(error)) {
            return registerOwnerWithoutTransaction(input, ownerRole);
        }

        throw error;
    } finally {
        await session.endSession();
    }
};

const updateProfile = async ({ authUser, fullName, email }) => {
    const userId = authUser?.userId;

    if (!userId) {
        throw createHttpError(401, 'Unauthorized');
    }

    const normalizedFullName = normalizeText(fullName);
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedFullName) {
        throw createHttpError(400, 'Full name is required');
    }

    if (!EMAIL_REGEX.test(normalizedEmail)) {
        throw createHttpError(400, 'Email is invalid');
    }

    const user = await User.findById(userId).select('_id fullName email status phone');

    if (!user) {
        throw createHttpError(404, 'User not found');
    }

    if (user.status !== 'active') {
        throw createHttpError(403, 'Account is not active');
    }

    const duplicatedEmail = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: userId },
    }).select('_id');

    if (duplicatedEmail) {
        throw createHttpError(409, 'Email already exists');
    }

    user.fullName = normalizedFullName;
    user.email = normalizedEmail;

    await user.save();

    return {
        id: String(user._id),
        fullName: user.fullName,
        email: user.email,
        status: user.status,
        phone: user.phone,
    };
};

const changePassword = async ({ authUser, currentPassword, newPassword }) => {
    const userId = authUser?.userId;

    if (!userId) {
        throw createHttpError(401, 'Unauthorized');
    }

    if (typeof currentPassword !== 'string' || currentPassword.length === 0) {
        throw createHttpError(400, 'Current password is required');
    }

    if (typeof newPassword !== 'string' || newPassword.length < MIN_PASSWORD_LENGTH) {
        throw createHttpError(400, `New password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    }

    if (currentPassword === newPassword) {
        throw createHttpError(400, 'New password must be different from current password');
    }

    const user = await User.findById(userId).select('_id passwordHash status');

    if (!user) {
        throw createHttpError(404, 'User not found');
    }

    if (user.status !== 'active') {
        throw createHttpError(403, 'Account is not active');
    }

    const isCurrentPasswordValid = await comparePassword(currentPassword, user.passwordHash);

    if (!isCurrentPasswordValid) {
        throw createHttpError(401, 'Current password is incorrect');
    }

    user.passwordHash = await hashPassword(newPassword);
    await user.save();
};

const forgotPassword = async ({ email }) => {
    const normalizedEmail = normalizeEmail(email);

    if (!EMAIL_REGEX.test(normalizedEmail)) {
        throw createHttpError(400, 'Email is invalid');
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
        return {
            message: 'If this email exists, a reset token has been generated for dev testing.',
            devResetToken: null,
            expiresAt: null,
        };
    }

    const rawResetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);

    user.passwordResetTokenHash = hashResetToken(rawResetToken);
    user.passwordResetExpiresAt = expiresAt;
    await user.save();

    return {
        message: 'If this email exists, a reset token has been generated for dev testing.',
        devResetToken: rawResetToken,
        expiresAt,
    };
};

const resetPassword = async ({ token, newPassword }) => {
    const rawToken = String(token || '').trim();

    if (!rawToken) {
        throw createHttpError(400, 'Reset token is required');
    }

    if (typeof newPassword !== 'string' || newPassword.length < MIN_PASSWORD_LENGTH) {
        throw createHttpError(400, `New password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    }

    const tokenHash = hashResetToken(rawToken);

    const user = await User.findOne({ passwordResetTokenHash: tokenHash });

    if (!user) {
        throw createHttpError(400, 'Reset token is invalid');
    }

    if (!user.passwordResetExpiresAt || user.passwordResetExpiresAt.getTime() <= Date.now()) {
        throw createHttpError(400, 'Reset token has expired');
    }

    user.passwordHash = await hashPassword(newPassword);
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;
    await user.save();
};

module.exports = {
        loginUser,
        registerOwner,
        updateProfile,
        changePassword,
        forgotPassword,
        resetPassword,
};
