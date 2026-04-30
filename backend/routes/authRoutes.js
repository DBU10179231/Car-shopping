const express = require('express');
const router = express.Router();
const {
    register, login, getProfile, toggleFavorite,
    forgotPassword, resetPassword, updatePassword,
    uploadPhoto, updateProfile, deleteAccount,
    getNotifications, markNotificationAsRead
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.delete('/profile', protect, deleteAccount);
router.put('/update-password', protect, updatePassword);
router.put('/upload-photo', protect, upload.single('avatar'), uploadPhoto);
router.post('/favorites', protect, toggleFavorite);

router.get('/notifications', protect, getNotifications);
router.put('/notifications/:id', protect, markNotificationAsRead);

module.exports = router;
