const POI = require('../models/poi.model');
const Category = require('../models/category.model');
const OwnerProfile = require('../../users/models/owner-profile.model');

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const parseNumber = (value, label) => {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    throw createHttpError(400, `${label} must be a valid number`);
  }

  return parsed;
};

const resolveOwnerProfileId = async (authUser) => {
  if (!authUser?.userId) {
    return null;
  }

  const ownerProfile = await OwnerProfile.findOne({ user: authUser.userId }).select('_id');
  return ownerProfile ? String(ownerProfile._id) : null;
};

const mapPOI = (poi) => ({
  id: String(poi._id),
  name: poi.name,
  shortDescription: poi.shortDescription,
  fullDescription: poi.fullDescription,
  address: poi.address || '',
  images: poi.images || [],
  lat: poi.lat,
  lng: poi.lng,
  geofenceRadius: poi.geofenceRadius,
  audioPriority: poi.audioPriority,
  isVisible: poi.isVisible,
  status: poi.status,
  category: poi.category
    ? {
        id: String(poi.category._id),
        name: poi.category.name,
      }
    : null,
  ownerProfileId: poi.ownerProfile ? String(poi.ownerProfile) : null,
  createdAt: poi.createdAt,
  updatedAt: poi.updatedAt,
});

const listPOIs = async ({ authUser, filters = {} }) => {
  const filter = {};
  const page = Math.max(1, Number(filters.page || 1));
  const limit = Math.min(100, Math.max(1, Number(filters.limit || 20)));

  if (String(authUser?.roleCode || '').toUpperCase() === 'OWNER') {
    const ownerProfileId = await resolveOwnerProfileId(authUser);
    if (!ownerProfileId) {
      return {
        data: [],
        meta: {
          total: 0,
          currentPage: page,
          pageSize: limit,
          totalPages: 0,
        },
      };
    }

    filter.ownerProfile = ownerProfileId;
  }

  if (filters.status) {
    filter.status = filters.status;
  }

  if (filters.query) {
    const query = String(filters.query).trim();
    filter.$or = [
      { name: { $regex: query, $options: 'i' } },
      { shortDescription: { $regex: query, $options: 'i' } },
      { fullDescription: { $regex: query, $options: 'i' } },
      { address: { $regex: query, $options: 'i' } },
    ];
  }

  const [pois, total] = await Promise.all([
    POI.find(filter)
      .populate('category', 'name')
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    POI.countDocuments(filter),
  ]);

  return {
    data: pois.map(mapPOI),
    meta: {
      total,
      currentPage: page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const createPOI = async ({ authUser, payload }) => {
  const category = await Category.findById(payload.category).select('_id');
  if (!category) {
    throw createHttpError(400, 'Category is invalid or not found');
  }

  const ownerProfileId = String(authUser?.roleCode || '').toUpperCase() === 'OWNER'
    ? await resolveOwnerProfileId(authUser)
    : payload.ownerProfile || null;

  const poi = await POI.create({
    name: payload.name,
    shortDescription: payload.shortDescription,
    fullDescription: payload.fullDescription,
    address: payload.address || payload.shortDescription || payload.name || '',
    images: Array.isArray(payload.images) ? payload.images.filter(Boolean) : [],
    lat: parseNumber(payload.lat, 'Latitude'),
    lng: parseNumber(payload.lng, 'Longitude'),
    geofenceRadius: parseNumber(payload.geofenceRadius, 'Geofence radius'),
    audioPriority: payload.audioPriority !== undefined ? Math.round(parseNumber(payload.audioPriority, 'Audio priority')) : 5,
    isVisible: payload.isVisible !== undefined ? Boolean(payload.isVisible) : true,
    status: payload.status || 'draft',
    category: category._id,
    ownerProfile: ownerProfileId,
  });

  const hydrated = await POI.findById(poi._id).populate('category', 'name');
  return mapPOI(hydrated);
};

const updatePOI = async ({ authUser, poiId, payload }) => {
  const poi = await POI.findById(poiId);
  if (!poi) {
    throw createHttpError(404, 'POI not found');
  }

  if (String(authUser?.roleCode || '').toUpperCase() === 'OWNER') {
    const ownerProfileId = await resolveOwnerProfileId(authUser);
    if (!ownerProfileId || String(poi.ownerProfile || '') !== ownerProfileId) {
      throw createHttpError(403, 'Forbidden');
    }
  }

  if (payload.name !== undefined) poi.name = payload.name;
  if (payload.shortDescription !== undefined) poi.shortDescription = payload.shortDescription;
  if (payload.fullDescription !== undefined) poi.fullDescription = payload.fullDescription;
  if (payload.address !== undefined) poi.address = payload.address;
  if (payload.images !== undefined) poi.images = Array.isArray(payload.images) ? payload.images.filter(Boolean) : [];
  if (payload.lat !== undefined) poi.lat = parseNumber(payload.lat, 'Latitude');
  if (payload.lng !== undefined) poi.lng = parseNumber(payload.lng, 'Longitude');
  if (payload.geofenceRadius !== undefined) poi.geofenceRadius = parseNumber(payload.geofenceRadius, 'Geofence radius');
  if (payload.audioPriority !== undefined) poi.audioPriority = Math.round(parseNumber(payload.audioPriority, 'Audio priority'));
  if (payload.isVisible !== undefined) poi.isVisible = Boolean(payload.isVisible);
  if (payload.status !== undefined) poi.status = payload.status;
  if (payload.category !== undefined) poi.category = payload.category;

  await poi.save();

  const hydrated = await POI.findById(poi._id).populate('category', 'name');
  return mapPOI(hydrated);
};

const deletePOI = async ({ authUser, poiId }) => {
  const poi = await POI.findById(poiId);
  if (!poi) {
    throw createHttpError(404, 'POI not found');
  }

  if (String(authUser?.roleCode || '').toUpperCase() === 'OWNER') {
    const ownerProfileId = await resolveOwnerProfileId(authUser);
    if (!ownerProfileId || String(poi.ownerProfile || '') !== ownerProfileId) {
      throw createHttpError(403, 'Forbidden');
    }
  }

  await POI.deleteOne({ _id: poi._id });
};

const getPOIById = async ({ authUser, poiId }) => {
  const poi = await POI.findById(poiId).populate('category', 'name');
  if (!poi) {
    throw createHttpError(404, 'POI not found');
  }

  if (String(authUser?.roleCode || '').toUpperCase() === 'OWNER') {
    const ownerProfileId = await resolveOwnerProfileId(authUser);
    if (!ownerProfileId || String(poi.ownerProfile || '') !== ownerProfileId) {
      throw createHttpError(403, 'Forbidden');
    }
  }

  return mapPOI(poi);
};

module.exports = {
  listPOIs,
  createPOI,
  updatePOI,
  deletePOI,
  getPOIById,
};
