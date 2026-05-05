const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    adminUser: {
      type: String,
      required: true,
      trim: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    targetId: {
      type: String,
      required: true,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  }
);

auditLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
