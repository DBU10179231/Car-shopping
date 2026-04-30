const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    username: { type: String, unique: true, sparse: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                // Only validate if it's a new plaintext password (not a bcrypt hash)
                if (v && v.startsWith('$2')) return true; // Already hashed
                return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(v);
            },
            message: 'Password must be 8+ chars with uppercase, lowercase, number, and special character'
        }
    },
    role: { type: String, enum: ['user', 'admin', 'dealer', 'support', 'finance', 'content_manager', 'super_admin'], default: 'user' },
    permissions: [{ type: String }],
    tokenVersion: { type: Number, default: 0 },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Car' }],
    avatar: { type: String, default: '' },
    status: { type: String, enum: ['active', 'banned'], default: 'active' },
    lastLogin: { type: Date },
    profilePhoto: { type: String, default: '' },
    isVerifiedSeller: { type: Boolean, default: false },
    phone: { type: String, default: '' },
    sellerType: { type: String, enum: ['private', 'dealership', 'broker', 'importer_exporter'], default: 'private' },
    verificationDocs: [{ type: String }],
    sellerBio: { type: String, default: '' },
    shopName: { type: String, default: '' },
    shopLogo: { type: String, default: '' },
    autoResponse: { type: String, default: '' },
    address: {
        street: { type: String, default: '' },
        city: { type: String, default: '' },
        state: { type: String, default: '' },
        zip: { type: String, default: '' }
    },
    notificationPreferences: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        inApp: { type: Boolean, default: true }
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
}, { timestamps: true });

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.revokeAllSessions = async function () {
    this.tokenVersion += 1;
    await this.save({ validateBeforeSave: false });
};

module.exports = mongoose.model('User', userSchema);
