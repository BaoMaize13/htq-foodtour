const mongoose = require('mongoose');

const OWNER_PROFILE_STATUS = ['pending', 'approved', 'rejected'];

const createBadRequestError = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

const ownerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    businessName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },
    businessAddress: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 255,
    },
    idCardNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      minlength: 8,
      maxlength: 32,
      match: /^[A-Z0-9-]+$/,
    },
    status: {
      type: String,
      enum: OWNER_PROFILE_STATUS,
      default: 'pending',
      index: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: null,
      maxlength: 500,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

ownerProfileSchema.pre('save', function normalizeStatusDrivenFields(next) {
  if (!this.isModified('status')) {
    return next();
  }

  if (this.status === 'approved') {
    this.approvedAt = new Date();
    this.rejectionReason = null;
    return next();
  }

  if (this.status === 'rejected') {
    this.approvedAt = null;

    if (!this.rejectionReason || !this.rejectionReason.trim()) {
      return next(createBadRequestError('Rejection reason is required when status is rejected'));
    }

    return next();
  }

  if (this.status === 'pending') {
    this.approvedAt = null;
    this.rejectionReason = null;
    this.submittedAt = new Date();
  }

  return next();
});

const OwnerProfile = mongoose.models.OwnerProfile || mongoose.model('OwnerProfile', ownerProfileSchema);

module.exports = OwnerProfile;
