const mongoose = require('mongoose');

const POI_STATUS = ['draft', 'active', 'hidden'];

const poiTranslationSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            default: '',
            maxlength: 150,
        },
        shortDescription: {
            type: String,
            trim: true,
            default: '',
            maxlength: 300,
        },
        fullDescription: {
            type: String,
            trim: true,
            default: '',
            maxlength: 5000,
        },
        address: {
            type: String,
            trim: true,
            default: '',
            maxlength: 255,
        },
    },
    {
        _id: false,
    }
);

const poiSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 150,
        },

        translations: {
            type: Map,
            of: poiTranslationSchema,
            default: {},
        },

        shortDescription: {
            type: String,
            required: true,
            trim: true,
            minlength: 10,
            maxlength: 300,
        },

        fullDescription: {
            type: String,
            required: true,
            trim: true,
            minlength: 20,
            maxlength: 5000,
        },

        address: {
            type: String,
            trim: true,
            default: '',
            maxlength: 255,
            index: true,
        },

        images: {
            type: [String],
            default: [],
            validate: {
                validator: (items) =>
                    Array.isArray(items) &&
                    items.every(
                        (item) =>
                            typeof item === 'string' &&
                            item.trim().length > 0
                    ),
                message: 'Images must be an array of non-empty strings',
            },
        },

        lat: {
            type: Number,
            required: true,
            min: -90,
            max: 90,
            validate: {
                validator: Number.isFinite,
                message: 'Latitude must be a finite number',
            },
        },

        lng: {
            type: Number,
            required: true,
            min: -180,
            max: 180,
            validate: {
                validator: Number.isFinite,
                message: 'Longitude must be a finite number',
            },
        },

        geofenceRadius: {
            type: Number,
            required: true,
            min: 10,
            max: 5000,
            validate: {
                validator: Number.isFinite,
                message: 'Geofence radius must be a finite number',
            },
        },

        audioPriority: {
            type: Number,
            default: 5,
            min: 0,
            max: 10,
            validate: {
                validator: (value) => Number.isInteger(value),
                message: 'Audio priority must be an integer between 0 and 10',
            },
            index: true,
        },

        isVisible: {
            type: Boolean,
            default: true,
            index: true,
        },

        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: true,
            index: true,
        },

        ownerProfile: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'OwnerProfile',
            default: null,
            index: true,
        },

        status: {
            type: String,
            enum: POI_STATUS,
            default: 'draft',
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

poiSchema.index({ category: 1, status: 1 });
poiSchema.index({ ownerProfile: 1, status: 1 });
poiSchema.index({ lat: 1, lng: 1 });

const POI = mongoose.models.POI || mongoose.model('POI', poiSchema);

module.exports = POI;