const Car = require('../models/Car');
const Order = require('../models/Order');
const User = require('../models/User');

// @desc    Get Seller Metrics
// @route   GET /api/seller/metrics
// @access  Private/Seller
const getSellerMetrics = async (req, res) => {
    try {
        const totalListings = await Car.countDocuments({ seller: req.user._id });
        const activeListings = await Car.countDocuments({ seller: req.user._id, status: 'active' });
        const pendingListings = await Car.countDocuments({ seller: req.user._id, status: 'pending' });

        // Find orders related to this seller's cars
        const sellerCars = await Car.find({ seller: req.user._id }).select('_id');
        const carIds = sellerCars.map(c => c._id);

        // Metrics calculations
        const totalOrders = await Order.countDocuments({ car: { $in: carIds } });
        const pendingOrders = await Order.countDocuments({ car: { $in: carIds }, status: 'pending' });

        // Revenue (Paid orders)
        const paidOrders = await Order.find({ car: { $in: carIds }, paymentStatus: 'paid' });
        const totalRevenue = paidOrders.reduce((acc, curr) => acc + (curr.negotiatedPrice || curr.totalPrice || 0), 0);

        // Inventory Value (Active listings)
        const activeCars = await Car.find({ seller: req.user._id, status: 'active' });
        const inventoryValue = activeCars.reduce((acc, curr) => acc + (curr.price || 0), 0);

        // Recent Inquiries/Orders
        const recentOrders = await Order.find({ car: { $in: carIds } })
            .populate('user', 'name email avatar profilePhoto')
            .populate('car', 'make model year price images')
            .sort({ createdAt: -1 })
            .limit(5);

        // Weekly Growth - simplified summary
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);
        const newInquiries = await Order.countDocuments({ car: { $in: carIds }, createdAt: { $gte: last7Days } });

        // Monthly Trend (Last 6 months)
        const monthlyTrend = [];
        for (let i = 5; i >= 0; i--) {
            const startOfMonth = new Date();
            startOfMonth.setMonth(startOfMonth.getMonth() - i);
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const endOfMonth = new Date(startOfMonth);
            endOfMonth.setMonth(endOfMonth.getMonth() + 1);

            const monthName = startOfMonth.toLocaleString('default', { month: 'short' });
            const leads = await Order.countDocuments({ car: { $in: carIds }, createdAt: { $gte: startOfMonth, $lt: endOfMonth } });
            const sales = await Order.countDocuments({ car: { $in: carIds }, status: 'completed', createdAt: { $gte: startOfMonth, $lt: endOfMonth } });

            monthlyTrend.push({ name: monthName, leads, sales });
        }

        res.json({
            totalListings,
            activeListings,
            pendingListings,
            totalOrders,
            pendingOrders,
            totalRevenue,
            inventoryValue,
            recentOrders,
            newInquiries,
            monthlyTrend,
            isVerified: req.user.isVerifiedSeller || false
        });
    } catch (err) {
        console.error('Seller Metrics Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get Seller Inventory
// @route   GET /api/seller/cars
// @access  Private/Seller
const getSellerInventory = async (req, res) => {
    try {
        const cars = await Car.find({ seller: req.user._id }).sort({ createdAt: -1 });
        res.json({ cars });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get Seller Orders (Inquiries for their cars)
// @route   GET /api/seller/orders
// @access  Private/Seller
const getSellerOrders = async (req, res) => {
    try {
        const sellerCars = await Car.find({ seller: req.user._id }).select('_id');
        const carIds = sellerCars.map(c => c._id);

        const orders = await Order.find({ car: { $in: carIds } })
            .populate('user', 'name email')
            .populate('car', 'make model year price images')
            .sort({ createdAt: -1 });

        res.json({ orders });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update Seller Profile
// @route   PUT /api/seller/profile
// @access  Private/Seller
const updateSellerProfile = async (req, res) => {
    try {
        const { sellerType, sellerBio, shopName, shopLogo, autoResponse, name, phone, address } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) return res.status(404).json({ message: 'User not found' });

        user.sellerType = sellerType || user.sellerType;
        user.sellerBio = sellerBio || user.sellerBio;
        user.shopName = shopName || user.shopName;
        user.shopLogo = shopLogo || user.shopLogo;
        user.autoResponse = autoResponse || user.autoResponse;
        user.name = name || user.name;
        user.phone = phone || user.phone;
        user.address = address || user.address;

        await user.save();
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Handle Test Drive Request
// @route   PUT /api/seller/orders/:id/status
// @access  Private/Seller
const handleOrderAction = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) return res.status(404).json({ message: 'Order not found' });

        // Ensure the car belongs to this seller
        const car = await Car.findById(order.car);
        if (car.seller.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        order.status = status;
        await order.save();
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getSellerMetrics,
    getSellerInventory,
    getSellerOrders,
    updateSellerProfile,
    handleOrderAction
};
