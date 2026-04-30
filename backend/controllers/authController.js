const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendEmail } = require('../utils/emailService');

const generateToken = (id, tokenVersion = 0, rememberMe = false) => {
    const expiresIn = rememberMe ? '30d' : '1d';
    return jwt.sign({ id, tokenVersion }, process.env.JWT_SECRET, { expiresIn });
};

// @desc    Register user
// @route   POST /api/auth/register
const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password)
            return res.status(400).json({ message: 'Please fill all fields' });

        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ message: 'Email already in use' });

        const user = await User.create({ name, email, password, role: role || 'user' });
        res.status(201).json({
            _id: user._id, name: user.name, email: user.email,
            role: user.role, profilePhoto: user.profilePhoto, token: generateToken(user._id, user.tokenVersion),
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res) => {
    try {
        const { email, password, rememberMe } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await user.matchPassword(password)))
            return res.status(401).json({ message: 'Invalid email or password' });

        res.json({
            _id: user._id, name: user.name, email: user.email,
            role: user.role, profilePhoto: user.profilePhoto, token: generateToken(user._id, user.tokenVersion, rememberMe),
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get logged-in user profile
// @route   GET /api/auth/profile
const getProfile = async (req, res) => {
    const user = await User.findById(req.user._id).populate('favorites');
    res.json(user);
};

// @desc    Toggle favorite car
// @route   PUT /api/auth/favorites/:carId
const toggleFavorite = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const carId = req.params.carId;
        const idx = user.favorites.indexOf(carId);
        if (idx === -1) user.favorites.push(carId);
        else user.favorites.splice(idx, 1);
        await user.save();
        res.json({ favorites: user.favorites });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 mins
    await user.save({ validateBeforeSave: false });

    // Send email
    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;
    const message = `You requested a password reset. Please make a PUT request to: \n\n ${resetUrl}`;

    try {
        await sendEmail({ email: user.email, subject: 'Password Reset Token', message });
        res.json({ message: 'Email sent' });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        res.status(500).json({ message: 'Email could not be sent' });
    }
};

// @desc    Reset Password
// @route   PUT /api/auth/reset-password/:token
const resetPassword = async (req, res) => {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
        passwordResetToken: resetPasswordToken,
        passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ token: generateToken(user._id, user.tokenVersion), message: 'Password reset successful' });
};

// @desc    Validate Reset Token
// @route   GET /api/auth/validate-reset-token/:token
const validateResetToken = async (req, res) => {
    try {
        const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
        const user = await User.findOne({
            passwordResetToken: resetPasswordToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ status: 'error', message: 'Invalid or expired token' });
        }

        res.json({ status: 'success', message: 'Token is valid' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

// @desc    Update Password
// @route   PUT /api/auth/update-password
const updatePassword = async (req, res) => {
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.matchPassword(req.body.currentPassword))) {
        return res.status(401).json({ message: 'Incorrect current password' });
    }

    user.password = req.body.newPassword;
    await user.save();
    res.json({ token: generateToken(user._id, user.tokenVersion), message: 'Password updated' });
};

// @desc    Upload Avatar Photo
// @route   PUT /api/auth/upload-photo
const uploadPhoto = async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'Please upload a file' });

    const protocol = req.protocol;
    const host = req.get('host');
    const fullPath = `${protocol}://${host}/${req.file.path.replace(/\\/g, '/')}`;

    const user = await User.findByIdAndUpdate(req.user._id, { profilePhoto: fullPath }, { new: true });
    res.json({ profilePhoto: user.profilePhoto });
};

// @desc    Update user profile details
// @route   PUT /api/auth/profile
const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.name = req.body.name || user.name;
        user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
        user.sellerBio = req.body.sellerBio !== undefined ? req.body.sellerBio : user.sellerBio;

        if (req.body.address) {
            user.address = { ...user.address, ...req.body.address };
        }
        if (req.body.notificationPreferences) {
            user.notificationPreferences = { ...user.notificationPreferences, ...req.body.notificationPreferences };
        }

        const updatedUser = await user.save();
        res.json(updatedUser);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Delete user account
// @route   DELETE /api/auth/profile
const deleteAccount = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        await User.deleteOne({ _id: req.user._id });
        res.json({ message: 'Account deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get user notifications
// @route   GET /api/auth/notifications
const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Mark notification as read
// @route   PUT /api/auth/notifications/:id
const markNotificationAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification || notification.user.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        notification.unread = false;
        await notification.save();
        res.json(notification);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    register, login, getProfile, toggleFavorite,
    forgotPassword, resetPassword, validateResetToken, updatePassword,
    uploadPhoto, updateProfile, deleteAccount,
    getNotifications, markNotificationAsRead
};
