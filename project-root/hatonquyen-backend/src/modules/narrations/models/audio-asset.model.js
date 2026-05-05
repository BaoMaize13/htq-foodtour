const mongoose = require('mongoose');
const { LANGUAGE_CODE_REGEX, normalizeLanguage } = require('../../../utils/language.util');

const AUDIO_SOURCE_TYPE = ['uploaded', 'tts'];
const AUDIO_ASSET_STATUS = ['pending', 'processing', 'completed', 'failed', 'ready', 'inactive'];

const audioAssetSchema = new mongoose.Schema(
  {
    poi: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'POI',
      required: true,
      index: true,
    },
    voice: {
      type: String,
      trim: true,
      default: 'Female (Nữ Nam)',
      maxlength: 120,
    },
    narration: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Narration',
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
    audioUrl: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
      match: /^(https?:\/\/\S+|\/\S+)/,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 255,
      match: /^[a-zA-Z0-9._-]+$/,
    },
    sourceType: {
      type: String,
      enum: AUDIO_SOURCE_TYPE,
      required: true,
      index: true,
    },
    duration: {
      type: Number,
      required: true,
      min: 0,
      max: 7200,
      validate: {
        validator: Number.isFinite,
        message: 'Duration must be a finite number',
      },
    },
    status: {
      type: String,
      enum: AUDIO_ASSET_STATUS,
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

audioAssetSchema.index({ narration: 1, language: 1, sourceType: 1, status: 1 });
audioAssetSchema.index({ poi: 1, language: 1, status: 1 });

const AudioAsset = mongoose.models.AudioAsset || mongoose.model('AudioAsset', audioAssetSchema);

module.exports = AudioAsset;
