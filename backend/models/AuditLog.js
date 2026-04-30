const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    targetType: { type: String, enum: ['user', 'car', 'order', 'finance', 'logistics', 'settings', 'role'], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId },
    details: { type: mongoose.Schema.Types.Mixed }, // Structured object of changes
    ipAddress: { type: String },
    userAgent: { type: String }
}, { timestamps: true });

// Optional: Indexing for faster searching through logs
auditLogSchema.index({ adminId: 1, createdAt: -1 });
auditLogSchema.index({ targetType: 1, action: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
