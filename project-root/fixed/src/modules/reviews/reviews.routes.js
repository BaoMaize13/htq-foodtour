const express = require('express');
const mongoose = require('mongoose');

const verifyAccessToken = require('../../middlewares/verify-access-token.middleware');
const Review = require('./models/review.model');
const POI = require('../places/models/poi.model');

const router = express.Router();

const PUBLIC_REVIEW_STATUSES = ['published', 'approved', 'active'];

const getAuthUserId = (req) => {
  return (
    req.user?.userId ||
    req.user?.id ||
    req.user?._id ||
    req.user?.sub ||
    req.auth?.userId ||
    req.auth?.id ||
    req.auth?._id ||
    req.auth?.sub ||
    null
  );
};

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value || ''));

const mapReview = (review) => ({
  id: String(review._id),
  user: review.userId
    ? {
        id: String(review.userId._id || review.userId),
        fullName: review.userId.fullName || reqUserFallbackName(review),
        email: review.userId.email || '',
      }
    : null,
  poi: review.poiId
    ? {
        id: String(review.poiId._id || review.poiId),
        name: review.poiId.name || '',
      }
    : null,
  poiId: String(review.poiId?._id || review.poiId || ''),
  userId: String(review.userId?._id || review.userId || ''),
  userName: review.userId?.fullName || reqUserFallbackName(review),
  rating: review.rating,
  content: review.content,
  status: review.status,
  createdAt: review.createdAt,
  updatedAt: review.updatedAt,
});

const reqUserFallbackName = (review) => {
  return review.userId?.email || 'Người dùng';
};


const listPublicReviewsByPoi = async (req, res, next) => {
  try {
    const poiId = String(req.params?.poiId || '').trim();

    if (!poiId || !isValidObjectId(poiId)) {
      return res.status(400).json({ message: 'POI id không hợp lệ.' });
    }

    const normalizedPoiId = new mongoose.Types.ObjectId(poiId);

    const [reviews, summary] = await Promise.all([
      Review.find({
        poiId: normalizedPoiId,
        status: { $in: PUBLIC_REVIEW_STATUSES },
      })
        .populate('poiId', 'name')
        .populate('userId', 'fullName email')
        .sort({ createdAt: -1 }),

      Review.aggregate([
        {
          $match: {
            poiId: normalizedPoiId,
            status: { $in: PUBLIC_REVIEW_STATUSES },
          },
        },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 },
          },
        },
      ]),
    ]);

    return res.status(200).json({
      data: reviews.map(mapReview),
      meta: {
        averageRating: Number((summary[0]?.averageRating || 0).toFixed(1)),
        totalReviews: Number(summary[0]?.totalReviews || 0),
      },
    });
  } catch (error) {
    return next(error);
  }
};

router.get('/poi/:poiId', listPublicReviewsByPoi);
router.get('/by-poi/:poiId', listPublicReviewsByPoi);

router.get('/', verifyAccessToken, async (req, res, next) => {
  try {
    const userId = getAuthUserId(req);

    if (!userId || !isValidObjectId(userId)) {
      return res.status(401).json({
        code: 'LOGIN_REQUIRED',
        message: 'Vui lòng đăng nhập để xem đánh giá của bạn.',
      });
    }

    const reviews = await Review.find({ userId })
      .populate('poiId', 'name')
      .populate('userId', 'fullName email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      data: reviews.map(mapReview),
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/', verifyAccessToken, async (req, res, next) => {
  try {
    const userId = getAuthUserId(req);

    if (!userId || !isValidObjectId(userId)) {
      return res.status(401).json({
        code: 'LOGIN_REQUIRED',
        message: 'Vui lòng đăng nhập để viết đánh giá.',
      });
    }

    const poiId = String(req.body?.poiId || '').trim();
    const rating = Number(req.body?.rating);
    const content = String(req.body?.content || '').trim();

    if (!poiId || !isValidObjectId(poiId)) {
      return res.status(400).json({ message: 'POI id không hợp lệ.' });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating phải là số nguyên từ 1 đến 5.' });
    }

    if (content.length < 3 || content.length > 1500) {
      return res.status(400).json({ message: 'Nội dung đánh giá phải từ 3 đến 1500 ký tự.' });
    }

    const poi = await POI.findOne({
      _id: poiId,
      status: 'active',
      isVisible: true,
    }).select('_id name');

    if (!poi) {
      return res.status(404).json({ message: 'Không tìm thấy địa điểm để đánh giá.' });
    }

    const review = await Review.create({
      poiId,
      userId,
      rating,
      content,
      status: 'published',
    });

    const [populatedReview, summary] = await Promise.all([
      Review.findById(review._id)
        .populate('poiId', 'name')
        .populate('userId', 'fullName email'),

      Review.aggregate([
        {
          $match: {
            poiId: new mongoose.Types.ObjectId(poiId),
            status: { $in: PUBLIC_REVIEW_STATUSES },
          },
        },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 },
          },
        },
      ]),
    ]);

    return res.status(201).json({
      message: 'Đánh giá đã được lưu thành công.',
      data: mapReview(populatedReview || review),
      meta: {
        averageRating: Number((summary[0]?.averageRating || 0).toFixed(1)),
        totalReviews: Number(summary[0]?.totalReviews || 0),
      },
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
