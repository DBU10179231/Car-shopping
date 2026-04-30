const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String },
    permissions: [{ type: String }],
    isSystemDefault: { type: Boolean, default: false } // To protect roles like 'admin' from deletion
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);
