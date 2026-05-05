const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema(
  {
    resource: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    actions: {
      type: [String],
      default: [],
      validate: {
        validator: (actions) =>
          Array.isArray(actions) && actions.every((action) => typeof action === 'string' && action.trim().length > 0),
        message: 'Each permission action must be a non-empty string',
      },
    },
  },
  { _id: false }
);

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      minlength: 2,
      maxlength: 50,
      match: /^[A-Z0-9_]+$/,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 300,
    },
    permissions: {
      type: [permissionSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

roleSchema.index({ code: 1 }, { unique: true });
roleSchema.index({ name: 1 }, { unique: true });

const Role = mongoose.models.Role || mongoose.model('Role', roleSchema);

module.exports = Role;
