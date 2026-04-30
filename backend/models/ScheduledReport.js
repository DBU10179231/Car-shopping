const mongoose = require('mongoose');

const scheduledReportSchema = new mongoose.Schema({
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    reportType: {
        type: String,
        required: true,
        enum: ['users', 'listings', 'transactions', 'test-drives', 'financial']
    },
    format: { type: String, required: true, enum: ['pdf', 'xlsx', 'pptx'] },
    frequency: { type: String, required: true, enum: ['daily', 'weekly', 'monthly'] },
    recipients: [{ type: String }],
    filters: { type: mongoose.Schema.Types.Mixed, default: {} },
    isActive: { type: Boolean, default: true },
    lastRunAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('ScheduledReport', scheduledReportSchema);
