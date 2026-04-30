const Logistics = require('../models/Logistics');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const { notifyLogisticsUpdate, notifySellerPickup } = require('../utils/emailService');

// @desc    Calculate shipping quote
// @route   POST /api/logistics/quote
const calculateShippingQuote = async (req, res) => {
    try {
        const { carId, pickupZip, deliveryZip } = req.body;

        // Mock calculation logic: Base fee + distance approximation
        const baseFee = 2500;
        const distanceFactor = Math.floor(Math.random() * 5000);
        const totalQuote = baseFee + distanceFactor;

        res.json({
            quote: totalQuote,
            currency: 'ETB',
            estimatedDays: 3,
            provider: 'AutoMarket Logistics'
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Book a delivery
// @route   POST /api/logistics/book
const bookDelivery = async (req, res) => {
    try {
        const { orderId, pickupDetails, deliveryDetails, quote } = req.body;
        const order = await Order.findById(orderId).populate('car seller user');

        if (!order) return res.status(404).json({ message: 'Order not found' });

        const logistics = await Logistics.create({
            order: orderId,
            car: order.car._id,
            buyer: order.user._id,
            seller: order.seller._id,
            trackingNumber: `TRK-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            pickupDetails,
            deliveryDetails,
            shippingQuote: { amount: quote },
            history: [{ status: 'pending_pickup', comment: 'Delivery booked and awaiting pickup scheduling.' }]
        });

        // Notify Seller about Pickup
        if (order.seller.email) {
            await notifySellerPickup(
                order.seller.email,
                order.car,
                pickupDetails.scheduledDate,
                pickupDetails.scheduledTime
            );
        }

        res.status(201).json({ message: 'Delivery booked successfully', logistics });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Update tracking status
// @route   PUT /api/logistics/:id/track
const updateTracking = async (req, res) => {
    try {
        const { status, location, comment } = req.body;
        const logistics = await Logistics.findById(req.params.id).populate('buyer');
        if (!logistics) return res.status(404).json({ message: 'Logistics record not found' });
        if (!logistics.buyer) return res.status(400).json({ message: 'Logistics record has no associated buyer' });

        logistics.status = status;
        logistics.currentLocation = location || logistics.currentLocation;
        logistics.history.push({ status, location, comment });

        // Automated date tracking
        if (status === 'picked_up' && !logistics.pickupDetails.actualPickupDate) {
            logistics.pickupDetails.actualPickupDate = new Date();
        }
        if (status === 'delivered' && !logistics.deliveryDetails.actualArrivalDate) {
            logistics.deliveryDetails.actualArrivalDate = new Date();
        }

        await logistics.save();

        // Synchronize with Order status
        const orderStatusMap = {
            'picked_up': 'shipped',
            'in_transit': 'shipped',
            'out_for_delivery': 'shipped',
            'delivered': 'delivered',
            'cancelled': 'cancelled'
        };

        if (orderStatusMap[status]) {
            await Order.findByIdAndUpdate(logistics.order, { status: orderStatusMap[status] });
        }

        // Notify Buyer
        if (logistics.buyer && logistics.buyer.email) {
            await notifyLogisticsUpdate(
                logistics.buyer.email,
                logistics.trackingNumber,
                status,
                location
            );
        }

        // In-app notification
        await Notification.create({
            user: logistics.buyer._id,
            title: 'Delivery Update',
            text: `Your vehicle delivery status is now: ${status.replace('_', ' ')}`,
            type: 'logistics'
        });

        res.json({ message: 'Tracking updated', logistics });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get tracking info
// @route   GET /api/logistics/:id
const getTrackingInfo = async (req, res) => {
    try {
        const logistics = await Logistics.findById(req.params.id)
            .populate('car', 'make model year images')
            .populate('seller', 'name shopName')
            .populate('buyer', 'name');

        if (!logistics) return res.status(404).json({ message: 'Logistics record not found' });
        res.json(logistics);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get all logistics records for the current buyer
// @route   GET /api/logistics/my-logistics
const getMyLogistics = async (req, res) => {
    try {
        const logistics = await Logistics.find({ buyer: req.user._id })
            .populate('car', 'make model year price images')
            .populate('seller', 'name shopName')
            .sort({ createdAt: -1 });
        res.json(logistics);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get all logistics records (Admin)
// @route   GET /api/logistics/admin/all
const getAllLogistics = async (req, res) => {
    try {
        const logistics = await Logistics.find({})
            .populate('buyer', 'name email')
            .populate('car', 'make model year price images')
            .sort({ createdAt: -1 });
        res.json(logistics);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    calculateShippingQuote,
    bookDelivery,
    updateTracking,
    getTrackingInfo,
    getMyLogistics,
    getAllLogistics
};
