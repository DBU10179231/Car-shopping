const express = require('express');
const router = express.Router();
const {
    createOrder, getMyOrders, getSellerOrders, getOrderById,
    getAllOrders, updateOrder, deleteOrder, proposePrice, acceptPrice,
    getOrderMessages, sendOrderMessage
} = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/', protect, createOrder);
router.get('/mine', protect, getMyOrders);
router.get('/seller', protect, getSellerOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/propose', protect, proposePrice);
router.put('/:id/accept', protect, acceptPrice);
router.get('/:id/messages', protect, getOrderMessages);
router.post('/:id/messages', protect, sendOrderMessage);
router.get('/', protect, adminOnly, getAllOrders);
router.put('/:id', protect, adminOnly, updateOrder);
router.delete('/:id', protect, adminOnly, deleteOrder);

module.exports = router;
