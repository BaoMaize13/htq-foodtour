const mongoose = require('mongoose');

const POI = require('../models/poi.model');
const Category = require('../models/category.model');
const MenuItem = require('../../menu/models/menu-item.model');
const Review = require('../../reviews/models/review.model');

const PUBLIC_REVIEW_STATUSES = ['published', 'approved', 'active'];
const UserFavorite = require('../../users/models/user-favorite.model');
const AudioAsset = require('../../narrations/models/audio-asset.model');
const Narration = require('../../narrations/models/narration.model');

const WALKING_SPEED_METERS_PER_MINUTE = 75;

const CATEGORY_TRANSLATIONS = {
    'mon-hoa': {
        vi: 'Món Hoa',
        en: 'Chinese Cuisine',
        ja: '中華料理',
        ko: '중식',
        fr: 'Cuisine chinoise',
        es: 'Comida china',
        de: 'Chinesische Küche',
        ru: 'Китайская кухня',
        'zh-Hans': '中餐',
        'zh-Hant': '中餐',
    },
    'mi-hu-tieu': {
        vi: 'Mì - Hủ tiếu',
        en: 'Noodles',
        ja: '麺料理',
        ko: '면 요리',
        fr: 'Nouilles',
        es: 'Fideos',
        de: 'Nudeln',
        ru: 'Лапша',
        'zh-Hans': '面食',
        'zh-Hant': '麵食',
    },
    lau: {
        vi: 'Lẩu',
        en: 'Hotpot',
        ja: '火鍋',
        ko: '훠궈',
        fr: 'Fondue chinoise',
        es: 'Hotpot',
        de: 'Hotpot',
        ru: 'Хотпот',
        'zh-Hans': '火锅',
        'zh-Hant': '火鍋',
    },
    'nuoc-uong': {
        vi: 'Nước uống',
        en: 'Drinks',
        ja: 'ドリンク',
        ko: '음료',
        fr: 'Boissons',
        es: 'Bebidas',
        de: 'Getränke',
        ru: 'Напитки',
        'zh-Hans': '饮品',
        'zh-Hant': '飲品',
    },
    dimsum: {
        vi: 'Dimsum',
        en: 'Dimsum',
        ja: '点心',
        ko: '딤섬',
        fr: 'Dimsum',
        es: 'Dimsum',
        de: 'Dimsum',
        ru: 'Димсам',
        'zh-Hans': '点心',
        'zh-Hant': '點心',
    },
};

const MENU_CATEGORY_TRANSLATIONS = {
    'Dimsum': CATEGORY_TRANSLATIONS.dimsum,
    'Mì - Hủ tiếu': CATEGORY_TRANSLATIONS['mi-hu-tieu'],
    'Lẩu': CATEGORY_TRANSLATIONS.lau,
    'Nước uống': CATEGORY_TRANSLATIONS['nuoc-uong'],
    'Món Hoa': CATEGORY_TRANSLATIONS['mon-hoa'],
};

const AUDIO_SPEECH_TEXT = {
    vi: {
        featuredMenu: 'Menu nổi bật gồm',
        reviewSummary: (totalReviews, averageRating) =>
            `Địa điểm này hiện có ${totalReviews} đánh giá, điểm trung bình ${averageRating.toFixed(1)} sao.`,
    },
    en: {
        featuredMenu: 'Featured menu includes',
        reviewSummary: (totalReviews, averageRating) =>
            `This place currently has ${totalReviews} reviews with an average rating of ${averageRating.toFixed(1)} stars.`,
    },
    ja: {
        featuredMenu: 'おすすめメニューは',
        reviewSummary: (totalReviews, averageRating) =>
            `この場所には現在${totalReviews}件のレビューがあり、平均評価は${averageRating.toFixed(1)}です。`,
    },
    ko: {
        featuredMenu: '추천 메뉴는',
        reviewSummary: (totalReviews, averageRating) =>
            `이 장소에는 현재 리뷰가 ${totalReviews}개 있으며 평균 평점은 ${averageRating.toFixed(1)}점입니다.`,
    },
    fr: {
        featuredMenu: 'Le menu recommandé comprend',
        reviewSummary: (totalReviews, averageRating) =>
            `Ce lieu compte actuellement ${totalReviews} avis, avec une note moyenne de ${averageRating.toFixed(1)} étoiles.`,
    },
    es: {
        featuredMenu: 'El menú recomendado incluye',
        reviewSummary: (totalReviews, averageRating) =>
            `Este lugar tiene actualmente ${totalReviews} reseñas, con una calificación media de ${averageRating.toFixed(1)} estrellas.`,
    },
    de: {
        featuredMenu: 'Das empfohlene Menü umfasst',
        reviewSummary: (totalReviews, averageRating) =>
            `Dieser Ort hat derzeit ${totalReviews} Bewertungen mit einer durchschnittlichen Bewertung von ${averageRating.toFixed(1)} Sternen.`,
    },
    ru: {
        featuredMenu: 'Рекомендуемое меню включает',
        reviewSummary: (totalReviews, averageRating) =>
            `У этого места сейчас ${totalReviews} отзывов, средняя оценка ${averageRating.toFixed(1)} звезды.`,
    },
    'zh-Hans': {
        featuredMenu: '推荐菜单包括',
        reviewSummary: (totalReviews, averageRating) =>
            `这个地点目前有 ${totalReviews} 条评价，平均评分为 ${averageRating.toFixed(1)} 星。`,
    },
    'zh-Hant': {
        featuredMenu: '推薦菜單包括',
        reviewSummary: (totalReviews, averageRating) =>
            `這個地點目前有 ${totalReviews} 則評價，平均評分為 ${averageRating.toFixed(1)} 星。`,
    },
};

const normalizeLang = (value) => {
    const raw = String(value || 'vi').trim();
    const lang = raw.toLowerCase();

    if (lang.startsWith('vi')) return 'vi';
    if (lang.startsWith('en')) return 'en';
    if (lang.startsWith('ja')) return 'ja';
    if (lang.startsWith('ko')) return 'ko';
    if (lang.startsWith('fr')) return 'fr';
    if (lang.startsWith('es')) return 'es';
    if (lang.startsWith('de')) return 'de';
    if (lang.startsWith('ru')) return 'ru';
    if (lang.startsWith('zh-hans')) return 'zh-Hans';
    if (lang.startsWith('zh-hant')) return 'zh-Hant';
    if (lang.startsWith('zh')) return 'zh-Hans';

    return 'en';
};

const getTranslation = (item, lang) => {
    if (!item || !item.translations) {
        return null;
    }

    if (item.translations instanceof Map) {
        return item.translations.get(lang) || item.translations.get('en') || null;
    }

    return item.translations[lang] || item.translations.en || null;
};

const getLocalizedField = (item, fieldName, lang) => {
    if (lang !== 'vi') {
        const translation = getTranslation(item, lang);
        const translatedValue = translation?.[fieldName];

        if (translatedValue && String(translatedValue).trim().length > 0) {
            return String(translatedValue).trim();
        }
    }

    return item[fieldName] || '';
};

const getLocalizedMenuName = (item, lang) => {
    if (lang !== 'vi') {
        const translation = getTranslation(item, lang);
        const translatedValue = translation?.name;

        if (translatedValue && String(translatedValue).trim().length > 0) {
            return String(translatedValue).trim();
        }
    }

    return item?.name || '';
};

const getLocalizedCategoryName = (categoryDoc, lang) => {
    const slug = String(categoryDoc?.slug || '').trim();

    if (!slug) {
        return categoryDoc?.name || '';
    }

    const translations = CATEGORY_TRANSLATIONS[slug];

    if (!translations) {
        return categoryDoc?.name || slug;
    }

    return translations[lang] || translations.en || translations.vi || categoryDoc?.name || slug;
};

const getLocalizedMenuCategory = (categoryName, lang) => {
    const raw = String(categoryName || '').trim();

    if (!raw) {
        return '';
    }

    const translations = MENU_CATEGORY_TRANSLATIONS[raw];

    if (!translations) {
        return raw;
    }

    return translations[lang] || translations.en || translations.vi || raw;
};

const createHttpError = (statusCode, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const toObjectId = (value, label) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
        throw createHttpError(400, `${label} is invalid`);
    }

    return new mongoose.Types.ObjectId(value);
};

const parseCoordinate = (value, label) => {
    if (value === undefined || value === null || value === '') {
        return null;
    }

    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
        throw createHttpError(400, `${label} must be a valid number`);
    }

    return parsed;
};

const toRadians = (value) => (value * Math.PI) / 180;

const calculateDistanceMeters = (originLat, originLng, targetLat, targetLng) => {
    if (![originLat, originLng, targetLat, targetLng].every(Number.isFinite)) {
        return null;
    }

    const earthRadiusMeters = 6371000;
    const dLat = toRadians(targetLat - originLat);
    const dLng = toRadians(targetLng - originLng);
    const lat1 = toRadians(originLat);
    const lat2 = toRadians(targetLat);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLng / 2) *
            Math.sin(dLng / 2) *
            Math.cos(lat1) *
            Math.cos(lat2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(earthRadiusMeters * c);
};

const buildTimeText = (distanceMeters) => {
    if (!Number.isFinite(distanceMeters)) {
        return 'Distance updating';
    }

    if (distanceMeters < 120) {
        return '1 min';
    }

    if (distanceMeters < 1000) {
        return `${Math.max(
            2,
            Math.round(distanceMeters / WALKING_SPEED_METERS_PER_MINUTE)
        )} min`;
    }

    return `${(distanceMeters / 1000).toFixed(1)} km`;
};

const normalizeAverageRating = (value) => {
    if (!Number.isFinite(value)) {
        return 0;
    }

    return Number(value.toFixed(1));
};

const buildInfoTags = ({
    categoryName,
    geofenceRadius,
    audioPriority,
    averageRating,
    totalReviews,
}) => {
    const tags = [];

    if (categoryName) {
        tags.push(categoryName);
    }

    if (Number.isFinite(geofenceRadius) && geofenceRadius > 0) {
        tags.push(`Geofence ${Math.round(geofenceRadius)}m`);
    }

    if (Number.isFinite(audioPriority)) {
        tags.push(`Audio #${Math.round(audioPriority)}`);
    }

    if (totalReviews > 0) {
        tags.push(`${averageRating.toFixed(1)}★ / ${totalReviews} review`);
    }

    return tags;
};

const buildPoiListMatch = async (filters = {}) => {
    const match = {
        status: 'active',
        isVisible: true,
    };

    if (filters.query) {
        const query = String(filters.query).trim();

        match.$or = [
            { name: { $regex: query, $options: 'i' } },
            { address: { $regex: query, $options: 'i' } },

            { 'translations.en.name': { $regex: query, $options: 'i' } },
            { 'translations.ja.name': { $regex: query, $options: 'i' } },
            { 'translations.ko.name': { $regex: query, $options: 'i' } },
            { 'translations.fr.name': { $regex: query, $options: 'i' } },
            { 'translations.es.name': { $regex: query, $options: 'i' } },
            { 'translations.de.name': { $regex: query, $options: 'i' } },
            { 'translations.ru.name': { $regex: query, $options: 'i' } },
            { 'translations.zh-Hans.name': { $regex: query, $options: 'i' } },
            { 'translations.zh-Hant.name': { $regex: query, $options: 'i' } },

            { 'translations.en.address': { $regex: query, $options: 'i' } },
            { 'translations.ja.address': { $regex: query, $options: 'i' } },
            { 'translations.ko.address': { $regex: query, $options: 'i' } },
            { 'translations.fr.address': { $regex: query, $options: 'i' } },
            { 'translations.es.address': { $regex: query, $options: 'i' } },
            { 'translations.de.address': { $regex: query, $options: 'i' } },
            { 'translations.ru.address': { $regex: query, $options: 'i' } },
            { 'translations.zh-Hans.address': { $regex: query, $options: 'i' } },
            { 'translations.zh-Hant.address': { $regex: query, $options: 'i' } },

            { shortDescription: { $regex: query, $options: 'i' } },
            { fullDescription: { $regex: query, $options: 'i' } },

            { 'translations.en.shortDescription': { $regex: query, $options: 'i' } },
            { 'translations.ja.shortDescription': { $regex: query, $options: 'i' } },
            { 'translations.ko.shortDescription': { $regex: query, $options: 'i' } },
            { 'translations.fr.shortDescription': { $regex: query, $options: 'i' } },
            { 'translations.es.shortDescription': { $regex: query, $options: 'i' } },
            { 'translations.de.shortDescription': { $regex: query, $options: 'i' } },
            { 'translations.ru.shortDescription': { $regex: query, $options: 'i' } },
            { 'translations.zh-Hans.shortDescription': { $regex: query, $options: 'i' } },
            { 'translations.zh-Hant.shortDescription': { $regex: query, $options: 'i' } },

            { 'translations.en.fullDescription': { $regex: query, $options: 'i' } },
            { 'translations.ja.fullDescription': { $regex: query, $options: 'i' } },
            { 'translations.ko.fullDescription': { $regex: query, $options: 'i' } },
            { 'translations.fr.fullDescription': { $regex: query, $options: 'i' } },
            { 'translations.es.fullDescription': { $regex: query, $options: 'i' } },
            { 'translations.de.fullDescription': { $regex: query, $options: 'i' } },
            { 'translations.ru.fullDescription': { $regex: query, $options: 'i' } },
            { 'translations.zh-Hans.fullDescription': { $regex: query, $options: 'i' } },
            { 'translations.zh-Hant.fullDescription': { $regex: query, $options: 'i' } },
        ];
    }

    if (filters.category) {
        const category = await Category.findOne({
            $or: [
                { slug: String(filters.category).trim().toLowerCase() },
                { name: new RegExp(`^${String(filters.category).trim()}$`, 'i') },
            ],
        }).select('_id');

        if (!category) {
            return null;
        }

        match.category = category._id;
    }

    return match;
};

const buildPoiAggregationPipeline = ({ match, userId }) => {
    const pipeline = [
        { $match: match },
        {
            $lookup: {
                from: Category.collection.name,
                localField: 'category',
                foreignField: '_id',
                as: 'categoryDoc',
            },
        },
        {
            $unwind: {
                path: '$categoryDoc',
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $lookup: {
                from: Review.collection.name,
                let: { poiId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$poiId', '$$poiId'] },
                                    { $in: ['$status', PUBLIC_REVIEW_STATUSES] },
                                ],
                            },
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            averageRating: { $avg: '$rating' },
                            totalReviews: { $sum: 1 },
                        },
                    },
                ],
                as: 'reviewSummary',
            },
        },
    ];

    if (userId) {
        pipeline.push({
            $lookup: {
                from: UserFavorite.collection.name,
                let: {
                    poiId: '$_id',
                    userId: new mongoose.Types.ObjectId(userId),
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$poiId', '$$poiId'] },
                                    { $eq: ['$userId', '$$userId'] },
                                ],
                            },
                        },
                    },
                    { $limit: 1 },
                ],
                as: 'favoriteMatches',
            },
        });
    }

    pipeline.push({
        $sort: {
            audioPriority: 1,
            updatedAt: -1,
        },
    });

    return pipeline;
};

const toPublicPoiDto = (item, deviceLocation, lang = 'vi') => {
    const reviewSummary = Array.isArray(item.reviewSummary)
        ? item.reviewSummary[0] || {}
        : item.reviewSummary || {};

    const averageRating = normalizeAverageRating(reviewSummary.averageRating);
    const totalReviews = Number(reviewSummary.totalReviews || 0);

    const distanceMeters = calculateDistanceMeters(
        deviceLocation.lat,
        deviceLocation.lng,
        item.lat,
        item.lng
    );

    const localizedCategoryName = getLocalizedCategoryName(item.categoryDoc, lang);

    return {
        id: String(item._id || item.id),
        name: getLocalizedField(item, 'name', lang),
        address: getLocalizedField(item, 'address', lang) || getLocalizedField(item, 'shortDescription', lang),
        shortDescription: getLocalizedField(item, 'shortDescription', lang),
        fullDescription: getLocalizedField(item, 'fullDescription', lang),
        lat: item.lat,
        lng: item.lng,
        geofenceRadius: item.geofenceRadius,
        audioPriority: item.audioPriority,
        imageUrl:
            Array.isArray(item.images) && item.images.length > 0
                ? item.images[0]
                : '',
        images: Array.isArray(item.images) ? item.images : [],
        badgeText: localizedCategoryName,
        timeText: buildTimeText(distanceMeters),
        infoTags: buildInfoTags({
            categoryName: localizedCategoryName,
            geofenceRadius: item.geofenceRadius,
            audioPriority: item.audioPriority,
            averageRating,
            totalReviews,
        }),
        isFavorite: Array.isArray(item.favoriteMatches)
            ? item.favoriteMatches.length > 0
            : Boolean(item.isFavorite),
        averageRating,
        totalReviews,
        status: item.status,
        category: item.categoryDoc
            ? {
                  id: String(item.categoryDoc._id),
                  name: localizedCategoryName,
                  slug: item.categoryDoc.slug,
              }
            : item.category || null,
        updatedAt: item.updatedAt,
    };
};

const listPublicPOIs = async ({ userId, filters = {} }) => {
    const page = Math.max(1, Number(filters.page || 1));
    const limit = Math.min(100, Math.max(1, Number(filters.limit || 20)));
    const match = await buildPoiListMatch(filters);

    if (!match) {
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

    const deviceLocation = {
        lat: parseCoordinate(filters.lat, 'lat'),
        lng: parseCoordinate(filters.lng, 'lng'),
    };

    const lang = normalizeLang(filters.lang);
    const basePipeline = buildPoiAggregationPipeline({ match, userId });

    const [items, totalResult] = await Promise.all([
        POI.aggregate([
            ...basePipeline,
            { $skip: (page - 1) * limit },
            { $limit: limit },
        ]),
        POI.aggregate([...basePipeline, { $count: 'total' }]),
    ]);

    const total = totalResult[0]?.total || 0;

    return {
        data: items.map((item) => toPublicPoiDto(item, deviceLocation, lang)),
        meta: {
            total,
            currentPage: page,
            pageSize: limit,
            totalPages: total === 0 ? 0 : Math.ceil(total / limit),
        },
    };
};

const listFavoritePOIs = async ({ userId, filters = {} }) => {
    const normalizedUserId = toObjectId(userId, 'User id');
    const page = Math.max(1, Number(filters.page || 1));
    const limit = Math.min(100, Math.max(1, Number(filters.limit || 100)));

    const favoriteDocs = await UserFavorite.find({ userId: normalizedUserId })
        .sort({ updatedAt: -1 })
        .select('poiId')
        .lean();

    const poiIds = favoriteDocs.map((item) => item.poiId).filter(Boolean);

    if (poiIds.length === 0) {
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

    const deviceLocation = {
        lat: parseCoordinate(filters.lat, 'lat'),
        lng: parseCoordinate(filters.lng, 'lng'),
    };

    const lang = normalizeLang(filters.lang);
    const match = {
        _id: { $in: poiIds },
        status: 'active',
        isVisible: true,
    };
    const basePipeline = buildPoiAggregationPipeline({ match, userId: String(normalizedUserId) });

    const [items, totalResult] = await Promise.all([
        POI.aggregate([
            ...basePipeline,
            { $skip: (page - 1) * limit },
            { $limit: limit },
        ]),
        POI.aggregate([...basePipeline, { $count: 'total' }]),
    ]);

    const total = totalResult[0]?.total || 0;

    return {
        data: items.map((item) => toPublicPoiDto(item, deviceLocation, lang)),
        meta: {
            total,
            currentPage: page,
            pageSize: limit,
            totalPages: total === 0 ? 0 : Math.ceil(total / limit),
        },
    };
};

const getPublicPOIById = async ({ poiId, userId, filters = {} }) => {
    const deviceLocation = {
        lat: parseCoordinate(filters.lat, 'lat'),
        lng: parseCoordinate(filters.lng, 'lng'),
    };

    const lang = normalizeLang(filters.lang);

    const match = {
        _id: toObjectId(poiId, 'POI id'),
        status: 'active',
        isVisible: true,
    };

    const [item] = await POI.aggregate(
        buildPoiAggregationPipeline({ match, userId })
    );

    if (!item) {
        throw createHttpError(404, 'POI not found');
    }

    return toPublicPoiDto(item, deviceLocation, lang);
};

const buildAudioLanguageCandidates = (lang) => {
    const normalizedLang = normalizeLang(lang);
    const lowerLang = String(normalizedLang).toLowerCase();
    const baseLang = lowerLang.split('-')[0];

    return [
        lowerLang,
        normalizedLang,
        baseLang,
        'en',
        'vi',
    ].filter((value, index, array) => value && array.indexOf(value) === index);
};

const isPlaceholderNarrationText = (value) => {
    const text = String(value || '')
        .trim()
        .toLowerCase();

    if (!text) {
        return true;
    }

    return (
        text.includes('xin chào') ||
        text.includes('xin chao') ||
        text.includes('đây là đoạn text') ||
        text.includes('day la doan text') ||
        text.includes('doan text') ||
        text.includes('placeholder') ||
        text.includes('sample text') ||
        text.includes('test audio') ||
        text.includes('demo audio')
    );
};

const getValidNarrationText = (narration) => {
    const candidates = [
        narration?.script,
        narration?.fullText,
        narration?.shortText,
    ];

    for (const item of candidates) {
        const text = String(item || '').trim();

        if (text && !isPlaceholderNarrationText(text)) {
            return text;
        }
    }

    return '';
};

const getAudioSpeechDictionary = (lang) => {
    return AUDIO_SPEECH_TEXT[lang] || AUDIO_SPEECH_TEXT.en;
};

const buildFeaturedMenuSpeech = (menuItems, lang) => {
    if (!Array.isArray(menuItems) || menuItems.length === 0) {
        return '';
    }

    const dictionary = getAudioSpeechDictionary(lang);

    const menuText = menuItems
        .filter((item) => item && item.name)
        .slice(0, 5)
        .map((item) => String(item.name).trim())
        .filter(Boolean)
        .join('; ');

    if (!menuText) {
        return '';
    }

    return `${dictionary.featuredMenu}: ${menuText}.`;
};

const buildReviewSpeech = (summary, lang) => {
    const totalReviews = Number(summary?.totalReviews || 0);
    const averageRating = normalizeAverageRating(summary?.averageRating);

    if (totalReviews <= 0) {
        return '';
    }

    const dictionary = getAudioSpeechDictionary(lang);

    return dictionary.reviewSummary(totalReviews, averageRating);
};

const buildBasePoiSpeechText = (poi, narration, lang) => {
    const name = getLocalizedField(poi, 'name', lang);
    const fullDescription = getLocalizedField(poi, 'fullDescription', lang);
    const shortDescription = getLocalizedField(poi, 'shortDescription', lang);

    const description = fullDescription || shortDescription;
    const poiText = `${name}. ${description}`.trim();

    if (poiText.length > 5 && !isPlaceholderNarrationText(poiText)) {
        return poiText;
    }

    const narrationText = getValidNarrationText(narration);

    if (narrationText) {
        return narrationText;
    }

    return '';
};

const buildFullPoiSpeechText = ({
    poi,
    narration,
    menuItems,
    reviewSummary,
    lang,
}) => {
    const parts = [];

    const baseText = buildBasePoiSpeechText(poi, narration, lang);
    const menuText = buildFeaturedMenuSpeech(menuItems, lang);
    const reviewText = buildReviewSpeech(reviewSummary, lang);

    if (baseText) {
        parts.push(baseText);
    }

    if (menuText) {
        parts.push(menuText);
    }

    if (reviewText) {
        parts.push(reviewText);
    }

    return parts
        .map((item) => String(item).trim())
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
};

const getPublicPoiAudio = async ({ poiId, filters = {} }) => {
    const normalizedPoiId = toObjectId(poiId, 'POI id');
    const lang = normalizeLang(filters.lang);
    const languageCandidates = buildAudioLanguageCandidates(lang);

    const poi = await POI.findOne({
        _id: normalizedPoiId,
        status: 'active',
        isVisible: true,
    }).lean();

    if (!poi) {
        throw createHttpError(404, 'POI not found');
    }

    const [
        audioAsset,
        narration,
        menuItems,
        reviewSummary,
    ] = await Promise.all([
        AudioAsset.findOne({
            poi: normalizedPoiId,
            language: { $in: languageCandidates },
            status: { $in: ['completed', 'ready'] },
        })
            .sort({
                updatedAt: -1,
                createdAt: -1,
            })
            .lean(),

        Narration.findOne({
            poi: normalizedPoiId,
            language: { $in: languageCandidates },
            status: { $in: ['published', 'approved'] },
        })
            .sort({
                updatedAt: -1,
                createdAt: -1,
            })
            .lean(),

        MenuItem.find({
            poiId: normalizedPoiId,
            status: 'active',
        })
            .sort({
                createdAt: 1,
            })
            .limit(5)
            .lean(),

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

    const summary = reviewSummary[0] || {
        averageRating: 0,
        totalReviews: 0,
    };

    const localizedMenuItems = menuItems.map((item) => ({
        ...item,
        name: getLocalizedMenuName(item, lang),
        category: getLocalizedMenuCategory(item.category, lang),
    }));

    const speechText = buildFullPoiSpeechText({
        poi,
        narration,
        menuItems: localizedMenuItems,
        reviewSummary: summary,
        lang,
    });

    const narrationText = getValidNarrationText(narration);
    const shouldUseAudioAsset =
        Boolean(audioAsset) &&
        Boolean(audioAsset.audioUrl) &&
        Boolean(narrationText);

    return {
        poiId: String(normalizedPoiId),
        language: audioAsset?.language || narration?.language || lang,

        hasAudioAsset: shouldUseAudioAsset,
        audioUrl: shouldUseAudioAsset ? audioAsset.audioUrl : '',
        audioSourceType: shouldUseAudioAsset ? audioAsset.sourceType : '',
        duration: shouldUseAudioAsset ? audioAsset.duration || 0 : 0,
        fileName: shouldUseAudioAsset ? audioAsset.fileName || '' : '',

        narrationId: narration?._id ? String(narration._id) : '',
        narrationTitle: narration?.title || '',

        speechText,
        isFallbackText: !shouldUseAudioAsset,

        featuredMenu: localizedMenuItems.map((item) => ({
            id: String(item._id),
            name: item.name,
            imageUrl: item.imageUrl || '',
            category: item.category,
            itemCode: item.itemCode,
        })),

        reviewSummary: {
            averageRating: normalizeAverageRating(summary.averageRating),
            totalReviews: Number(summary.totalReviews || 0),
        },
    };
};

const listPoiMenuItems = async ({ poiId, filters = {} }) => {
    const normalizedPoiId = toObjectId(poiId, 'POI id');
    const lang = normalizeLang(filters.lang);

    const items = await MenuItem.find({
        poiId: normalizedPoiId,
        status: 'active',
    })
        .sort({ createdAt: 1 })
        .lean();

    return {
        data: items.map((item) => ({
            id: String(item._id),
            name: getLocalizedMenuName(item, lang),
            price: item.price,
            imageUrl: item.imageUrl || '',
            category: getLocalizedMenuCategory(item.category, lang),
            itemCode: item.itemCode,
            poiId: String(item.poiId),
        })),
    };
};

const listPoiReviews = async ({ poiId }) => {
    const normalizedPoiId = toObjectId(poiId, 'POI id');

    const [reviews, summary] = await Promise.all([
        Review.find({
            poiId: normalizedPoiId,
            status: { $in: PUBLIC_REVIEW_STATUSES },
        })
            .populate('userId', 'fullName')
            .sort({ createdAt: -1 })
            .lean(),

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

    return {
        data: reviews.map((item) => ({
            id: String(item._id),
            poiId: String(item.poiId),
            userId: String(item.userId?._id || item.userId),
            userName: item.userId?.fullName || 'Nguoi dung',
            rating: item.rating,
            content: item.content,
            createdAt: item.createdAt,
            status: item.status,
        })),
        meta: {
            averageRating: normalizeAverageRating(summary[0]?.averageRating),
            totalReviews: Number(summary[0]?.totalReviews || 0),
        },
    };
};

const addPoiFavorite = async ({ userId, poiId }) => {
    const normalizedUserId = toObjectId(userId, 'User id');
    const normalizedPoiId = toObjectId(poiId, 'POI id');

    const poi = await POI.findOne({
        _id: normalizedPoiId,
        status: 'active',
        isVisible: true,
    }).select('_id');

    if (!poi) {
        throw createHttpError(404, 'POI not found');
    }

    await UserFavorite.findOneAndUpdate(
        {
            userId: normalizedUserId,
            poiId: normalizedPoiId,
        },
        {
            $setOnInsert: {
                userId: normalizedUserId,
                poiId: normalizedPoiId,
            },
        },
        {
            upsert: true,
            new: true,
        }
    );

    return {
        poiId: String(normalizedPoiId),
        isFavorite: true,
    };
};

const removePoiFavorite = async ({ userId, poiId }) => {
    const normalizedUserId = toObjectId(userId, 'User id');
    const normalizedPoiId = toObjectId(poiId, 'POI id');

    await UserFavorite.deleteOne({
        userId: normalizedUserId,
        poiId: normalizedPoiId,
    });

    return {
        poiId: String(normalizedPoiId),
        isFavorite: false,
    };
};

module.exports = {
    listPublicPOIs,
    listFavoritePOIs,
    getPublicPOIById,
    getPublicPoiAudio,
    listPoiMenuItems,
    listPoiReviews,
    addPoiFavorite,
    removePoiFavorite,
};