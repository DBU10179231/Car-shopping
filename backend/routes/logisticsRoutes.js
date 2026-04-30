const express = require('express');
const router = express.Router();
const {
    calculateShippingQuote,
    bookDelivery,
    updateTracking,
    getTrackingInfo,
    getMyLogistics,
    getAllLogistics
} = require('../controllers/logisticsController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/quote', protect, calculateShippingQuote);
router.post('/book', protect, bookDelivery);
router.get('/my-logistics', protect, getMyLogistics);
router.get('/admin/all', protect, adminOnly, getAllLogistics);
router.get('/:id', protect, getTrackingInfo);
router.put('/:id/track', protect, adminOnly, updateTracking);

module.exports = router;
