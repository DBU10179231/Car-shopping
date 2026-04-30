const express = require('express');
const router = express.Router();
const {
    getSellerMetrics,
    getSellerInventory,
    getSellerOrders,
    updateSellerProfile,
    handleOrderAction
} = require('../controllers/sellerController');
const upload = require('../middleware/uploadMiddleware');
const { protect, sellerOnly } = require('../middleware/authMiddleware');

router.use(protect, sellerOnly); // All seller routes require seller/admin role

router.get('/metrics', getSellerMetrics);
router.get('/inventory', getSellerInventory);
router.get('/orders', getSellerOrders);
router.put('/profile', updateSellerProfile);
router.put('/orders/:id/status', handleOrderAction);

// Handle verification docs upload
router.post('/upload-docs', upload.array('docs', 5), (req, res) => {
    if (!req.files || req.files.length === 0) return res.status(400).json({ message: 'No files uploaded' });
    const paths = req.files.map(f => `${req.protocol}://${req.get('host')}/${f.path.replace(/\\/g, '/')}`);
    res.json({ paths });
});

module.exports = router;
