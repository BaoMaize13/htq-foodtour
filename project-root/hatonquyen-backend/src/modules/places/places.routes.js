const express = require('express');
const Category = require('./models/category.model');
const verifyAccessToken = require('../../middlewares/verify-access-token.middleware');
const requireRole = require('../../middlewares/require-role.middleware');
const { listPOIs, createPOI, updatePOI, deletePOI, getPOIById } = require('./services/place-admin.service');
const { validateListPOIQuery, validateCreatePOI, validateUpdatePOI, validateDeletePOI } = require('./validators/place.validators');

const router = express.Router();

router.get('/categories', verifyAccessToken, requireRole('ADMIN', 'OWNER'), async (req, res, next) => {
  try {
    const data = await Category.find().select('_id name slug').sort({ name: 1 });
    return res.status(200).json({
      data: data.map((item) => ({
        id: String(item._id),
        name: item.name,
        slug: item.slug,
      })),
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/', verifyAccessToken, requireRole('ADMIN', 'OWNER'), validateListPOIQuery, async (req, res, next) => {
  try {
    const result = await listPOIs({ authUser: req.user, filters: req.query });
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
});

router.post('/', verifyAccessToken, requireRole('ADMIN', 'OWNER'), validateCreatePOI, async (req, res, next) => {
  try {
    const data = await createPOI({ authUser: req.user, payload: req.body });
    return res.status(201).json({ data });
  } catch (error) {
    return next(error);
  }
});

router.put('/:poiId', verifyAccessToken, requireRole('ADMIN', 'OWNER'), validateUpdatePOI, async (req, res, next) => {
  try {
    const data = await updatePOI({ authUser: req.user, poiId: req.params.poiId, payload: req.body });
    return res.status(200).json({ data });
  } catch (error) {
    return next(error);
  }
});

router.get('/:poiId', verifyAccessToken, requireRole('ADMIN', 'OWNER'), validateDeletePOI, async (req, res, next) => {
  try {
    const data = await getPOIById({ authUser: req.user, poiId: req.params.poiId });
    return res.status(200).json({ data });
  } catch (error) {
    return next(error);
  }
});

router.delete('/:poiId', verifyAccessToken, requireRole('ADMIN', 'OWNER'), validateDeletePOI, async (req, res, next) => {
  try {
    await deletePOI({ authUser: req.user, poiId: req.params.poiId });
    return res.status(200).json({ message: 'POI deleted successfully' });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
