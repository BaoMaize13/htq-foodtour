const mongoose = require('mongoose');

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const normalizeSlug = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 120,
      match: SLUG_REGEX,
      set: normalizeSlug,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

categorySchema.pre('validate', function ensureSlug(next) {
  if (!this.slug && this.name) {
    this.slug = normalizeSlug(this.name);
  }

  next();
});

categorySchema.index({ slug: 1 }, { unique: true });
categorySchema.index({ name: 1 });

const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);

module.exports = Category;
