const mongoose = require('mongoose');

const REVIEW_STATUS = ['published', 'hidden'];

const reviewSchema = new mongoose.Schema(
  {
    poiId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'POI',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: 'Rating must be an integer between 1 and 5',
      },
    },
    content: {
      type: String,
      trim: true,
      required: true,
      maxlength: 1500,
      minlength: 3,
    },
    status: {
      type: String,
      enum: REVIEW_STATUS,
      default: 'published',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

reviewSchema.index({ poiId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, createdAt: -1 });

const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);

module.exports = Review;
