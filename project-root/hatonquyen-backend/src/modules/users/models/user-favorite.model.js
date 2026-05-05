const mongoose = require('mongoose');

const userFavoriteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    poiId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'POI',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'userfavorites',
  }
);

userFavoriteSchema.index({ userId: 1, poiId: 1 }, { unique: true });
userFavoriteSchema.index({ poiId: 1, userId: 1 });

const UserFavorite = mongoose.models.UserFavorite || mongoose.model('UserFavorite', userFavoriteSchema);

module.exports = UserFavorite;
