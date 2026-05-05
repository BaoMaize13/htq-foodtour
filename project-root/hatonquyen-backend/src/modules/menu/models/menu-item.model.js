const mongoose = require('mongoose');

const MENU_STATUS = ['active', 'hidden'];

const menuItemTranslationSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            default: '',
            maxlength: 150,
        },
    },
    {
        _id: false,
    }
);

const menuItemSchema = new mongoose.Schema(
    {
        itemCode: {
            type: String,
            required: false,
            trim: true,
            uppercase: true,
            minlength: 3,
            maxlength: 40,
            default: null,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 150,
        },
        translations: {
            type: Map,
            of: menuItemTranslationSchema,
            default: {},
        },
        price: {
            type: Number,
            required: true,
            min: 0,
            validate: {
                validator: Number.isFinite,
                message: 'Price must be a finite number',
            },
        },
        imageUrl: {
            type: String,
            trim: true,
            default: '',
            maxlength: 2000,
        },
        poiId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'POI',
            required: true,
            index: true,
        },
        category: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
            index: true,
        },
        status: {
            type: String,
            enum: MENU_STATUS,
            default: 'active',
            required: true,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

menuItemSchema.index({ poiId: 1, itemCode: 1 }, { unique: true, sparse: true });
menuItemSchema.index({ poiId: 1, status: 1 });

const MenuItem = mongoose.models.MenuItem || mongoose.model('MenuItem', menuItemSchema);

module.exports = MenuItem;