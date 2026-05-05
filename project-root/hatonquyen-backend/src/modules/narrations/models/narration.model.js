const mongoose = require('mongoose');
const { LANGUAGE_CODE_REGEX, normalizeLanguage } = require('../../../utils/language.util');

const NARRATION_STATUS = ['draft', 'pending', 'pending_approval', 'approved', 'published', 'revision_requested', 'rejected'];

const narrationSchema = new mongoose.Schema(
  {
    poi: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'POI',
      required: true,
      index: true,
    },
    language: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      set: normalizeLanguage,
      match: LANGUAGE_CODE_REGEX,
      maxlength: 20,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    script: {
      type: String,
      required: true,
      trim: true,
    },
    shortText: {
      type: String,
      required: true,
      trim: true,
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (items) => Array.isArray(items) && items.every((item) => typeof item === 'string' && item.trim().length > 0),
        message: 'Images must be an array of non-empty strings',
      },
    },
    fullText: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: NARRATION_STATUS,
      default: 'draft',
      index: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    moderationNote: {
      type: String,
      trim: true,
      default: null,
      maxlength: 1000,
    },
    revisionMessage: {
      type: String,
      trim: true,
      default: null,
      maxlength: 1000,
    },
    rejectedReason: {
      type: String,
      trim: true,
      default: null,
      maxlength: 1000,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

narrationSchema.index({ poi: 1, language: 1, status: 1 });
narrationSchema.index({ submittedBy: 1, status: 1 });

const Narration = mongoose.models.Narration || mongoose.model('Narration', narrationSchema);

module.exports = Narration;
