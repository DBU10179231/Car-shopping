const Order = require('../models/Order');
const Car = require('../models/Car');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { notifyNewInquiry, notifyOrderStatusChange } = require('../utils/emailService');

// @desc    Place inquiry/order
// @route   POST /api/orders
const createOrder = async (req, res) => {
    try {
        const { car, type, message, phone, bookingDate, bookingTime } = req.body;

        // Find car to get seller info
        const carInfo = await Car.findById(car).populate('seller');
        if (!carInfo) return res.status(404).json({ message: 'Car not found' });

        const basePrice = carInfo.price;
        const taxRate = 0.15; // 15% Tax
        const commissionRate = 0.05; // 5% Platform Commission

        const taxAmount = Math.round(basePrice * taxRate);
        const commissionAmount = Math.round(basePrice * commissionRate);
        const totalPrice = basePrice + taxAmount; // Total buyer pays

        const orderData = {
            user: req.user._id,
            car,
            type: type || 'buy',
            message,
            phone,
            bookingDate,
            bookingTime,
            basePrice,
            taxAmount,
            commissionAmount,
            totalPrice
        };

        // If it's a 'buy' type, we initiate negotiation
        if (orderData.type === 'buy') {
            orderData.negotiationStatus = 'active';
            orderData.negotiatedPrice = basePrice;
        }

        const order = await Order.create(orderData);

        // Notify Seller
        if (carInfo.seller && carInfo.seller.email) {
            await notifyNewInquiry(carInfo.seller.email, carInfo, req.user.name);
        }

        // Create initial message if message is provided
        if (message) {
            await Message.create({
                sender: req.user._id,
                recipient: carInfo.seller._id,
                car,
                order: order._id,
                content: message
            });
        }

        // Notify Admins for 'buy' type orders (Purchase Inquiries)
        if (type === 'buy') {
            try {
                const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } });
                const adminNotifications = admins.map(admin => ({
                    user: admin._id,
                    title: '💼 New Purchase Inquiry',
                    text: `${req.user.name} is interested in buying ${carInfo.make} ${carInfo.model}.`,
                    type: 'alert',
                    link: `/admin/orders/${order._id}`
                }));
                if (adminNotifications.length > 0) {
                    await Notification.insertMany(adminNotifications);
                }
            } catch (adminErr) {
                console.error('Admin inquiry notification error:', adminErr.message);
            }
        }

        res.status(201).json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get my orders
// @route   GET /api/orders/mine
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .populate({
                path: 'car',
                select: 'make model year price images seller',
                populate: { path: 'seller', select: 'name email phone' }
            })
            .sort({ createdAt: -1 });

        // Add unread message count to each order (messages sent TO the user)
        const ordersWithUnread = await Promise.all(orders.map(async (order) => {
            const unreadCount = await Message.countDocuments({
                order: order._id,
                recipient: req.user._id,
                isRead: false
            });
            return { ...order._doc, unreadMessages: unreadCount };
        }));

        res.json(ordersWithUnread);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get seller's received orders/negotiations
// @route   GET /api/orders/seller
const getSellerOrders = async (req, res) => {
    try {
        // Find cars owned by this seller
        const myCars = await Car.find({ seller: req.user._id }).select('_id');
        const carIds = myCars.map(c => c._id);

        const orders = await Order.find({ car: { $in: carIds } })
            .populate('user', 'name email phone profilePhoto')
            .populate('car', 'make model year price images')
            .sort({ createdAt: -1 });

        // Add unread message count to each order
        const ordersWithUnread = await Promise.all(orders.map(async (order) => {
            const unreadCount = await Message.countDocuments({
                order: order._id,
                recipient: req.user._id,
                isRead: false
            });
            return { ...order._doc, unreadMessages: unreadCount };
        }));

        res.json(ordersWithUnread);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get order details
// @route   GET /api/orders/:id
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'name email phone')
            .populate({
                path: 'car',
                populate: { path: 'seller', select: 'name email phone' }
            });

        if (!order) return res.status(404).json({ message: 'Order not found' });

        // Auth check
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin' &&
            order.user._id.toString() !== req.user._id.toString() &&
            order.car.seller._id.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Propose a new price (Seller or Buyer)
// @route   PUT /api/orders/:id/propose
const proposePrice = async (req, res) => {
    try {
        const { price, message } = req.body;
        const order = await Order.findById(req.params.id).populate('car');
        if (!order) return res.status(404).json({ message: 'Order not found' });

        order.negotiatedPrice = price;
        order.negotiationStatus = 'active';
        await order.save();

        // Create notification message
        const recipient = req.user._id.toString() === order.user.toString() ? order.car.seller : order.user;
        await Message.create({
            sender: req.user._id,
            recipient,
            order: order._id,
            car: order.car._id,
            content: message || `Proposing new price: $${Number(price).toLocaleString()}`
        });

        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Accept negotiated price
// @route   PUT /api/orders/:id/accept
const acceptPrice = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate({
            path: 'car',
            populate: { path: 'seller' }
        });
        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (!order.car) return res.status(400).json({ message: 'Associated car no longer exists' });

        const taxRate = 0.15;
        const commissionRate = 0.05;

        order.negotiationStatus = 'accepted';
        // Use negotiatedPrice if available, otherwise fallback to current basePrice
        const finalBasePrice = order.negotiatedPrice || order.basePrice || 0;
        
        order.basePrice = finalBasePrice;
        order.taxAmount = Math.round(order.basePrice * taxRate);
        order.commissionAmount = Math.round(order.basePrice * commissionRate);
        order.totalPrice = order.basePrice + order.taxAmount;
        order.status = 'approved'; 

        await order.save();

        // Create confirmation message
        const sellerId = order.car.seller?._id || order.car.seller;
        const recipient = req.user._id.toString() === order.user.toString() ? sellerId : order.user;
        
        const displayPrice = (order.totalPrice || 0).toLocaleString();

        await Message.create({
            sender: req.user._id,
            recipient,
            order: order._id,
            car: order.car._id,
            content: `Price of $${displayPrice} accepted. Proceeding to payment.`
        });

        // Notify Admins for Price Acceptance
        try {
            const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } });
            const adminNotifications = admins.map(admin => ({
                user: admin._id,
                title: '🤝 Deal Struck',
                text: `Price for ${order.car.make} ${order.car.model} ($${(order.basePrice || 0).toLocaleString()}) has been agreed.`,
                type: 'alert',
                link: `/admin/orders/${order._id}`
            }));
            if (adminNotifications.length > 0) {
                await Notification.insertMany(adminNotifications);
            }
        } catch (adminErr) {
            console.error('Admin deal notification error:', adminErr.message);
        }

        res.json(order);
    } catch (err) {
        console.error('Accept Price Error:', err);
        res.status(500).json({ message: err.message || 'Error accepting price' });
    }
};

// @desc    Get messages for an order
// @route   GET /api/orders/:id/messages
const getOrderMessages = async (req, res) => {
    try {
        const isAdmin = ['admin', 'super_admin'].includes(req.user.role);

        // Mark as read if user is recipient OR if user is admin (and message isn't from another admin)
        if (isAdmin) {
            // Find all admins
            const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } }).select('_id');
            const adminIds = admins.map(a => a._id);

            await Message.updateMany(
                { order: req.params.id, sender: { $nin: adminIds }, isRead: false },
                { isRead: true }
            );
        } else {
            await Message.updateMany(
                { order: req.params.id, recipient: req.user._id, isRead: false },
                { isRead: true }
            );
        }

        const messages = await Message.find({ order: req.params.id })
            .populate('sender', 'name profilePhoto')
            .sort({ createdAt: 1 });
        res.json(messages);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Send message for an order
// @route   POST /api/orders/:id/messages
const sendOrderMessage = async (req, res) => {
    try {
        const { content } = req.body;
        const order = await Order.findById(req.params.id).populate('car');
        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (!order.car) return res.status(400).json({ message: 'Car associated with this order no longer exists' });

        const isBuyer = req.user._id.toString() === order.user.toString();
        const sellerId = order.car.seller._id || order.car.seller;
        const isSeller = req.user._id.toString() === sellerId.toString();
        const isAdmin = ['admin', 'super_admin'].includes(req.user.role);

        const recipientId = isBuyer ? sellerId : order.user;

        const message = await Message.create({
            sender: req.user._id,
            recipient: recipientId, // Direct recipient for primary tracking
            order: order._id,
            car: order.car._id,
            content
        });

        // --- Notification Logic ---
        const notificationTitle = `New Message regarding ${order.car.make} ${order.car.model}`;
        const safeContent = content || '';
        const notificationText = `${req.user.name}: ${safeContent.substring(0, 50)}${safeContent.length > 50 ? '...' : ''}`;
        const chatLink = isAdmin ? `/admin/orders?search=${order._id.toString().slice(-6)}` :
            isSeller ? `/seller/messages?order=${order._id}` : `/dashboard?tab=negotiations&order=${order._id}`;

        let notificationTargets = [];

        if (isBuyer) {
            // User sent: Notify Seller + Admins
            notificationTargets.push({ user: sellerId, title: notificationTitle, text: notificationText, type: 'message', link: `/seller/messages?order=${order._id}` });
        } else if (isSeller) {
            // Seller sent: Notify Buyer + Admins
            notificationTargets.push({ user: order.user, title: notificationTitle, text: notificationText, type: 'message', link: `/dashboard?tab=negotiations&order=${order._id}` });
        } else if (isAdmin) {
            // Admin sent: Notify Buyer + Seller
            notificationTargets.push({ user: order.user, title: notificationTitle, text: notificationText, type: 'message', link: `/dashboard?tab=negotiations&order=${order._id}` });
            notificationTargets.push({ user: sellerId, title: notificationTitle, text: notificationText, type: 'message', link: `/seller/messages?order=${order._id}` });
        }

        // Always notify Admins if not sent by an Admin
        if (!isAdmin) {
            try {
                const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } });
                admins.forEach(admin => {
                    if (admin._id.toString() !== req.user._id.toString()) {
                        notificationTargets.push({
                            user: admin._id,
                            title: `[Support] ${notificationTitle}`,
                            text: notificationText,
                            type: 'message',
                            link: `/admin/orders?search=${order._id.toString().slice(-6)}`
                        });
                    }
                });
            } catch (err) {
                console.error('Error finding admins for notification:', err);
            }
        }

        if (notificationTargets.length > 0) {
            await Notification.insertMany(notificationTargets);
        }

        res.status(201).json(message);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get all orders (admin)
// @route   GET /api/orders
const getAllOrders = async (req, res) => {
    try {
        const { type } = req.query;
        let query = {};
        if (type) query.type = type;

        const orders = await Order.find(query)
            .populate('user', 'name email phone role profilePhoto')
            .populate('car', 'make model year price images')
            .sort({ createdAt: -1 });

        // For admins, show total unread messages in the order that are NOT from admins
        const ordersWithUnread = await Promise.all(orders.map(async (order) => {
            // Find all admins to exclude their messages from the "unread for support" count
            const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } }).select('_id');
            const adminIds = admins.map(a => a._id.toString());

            const unreadCount = await Message.countDocuments({
                order: order._id,
                sender: { $nin: adminIds },
                isRead: false
            });
            return { ...order._doc, unreadMessages: unreadCount };
        }));

        res.json(ordersWithUnread);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Update order status
// @route   PUT /api/orders/:id
const updateOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        order.status = req.body.status || order.status;
        if (req.body.bookingDate) order.bookingDate = req.body.bookingDate;
        if (req.body.bookingTime) order.bookingTime = req.body.bookingTime;

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
const deleteOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        await order.deleteOne();
        res.json({ message: 'Order deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    createOrder,
    getMyOrders,
    getSellerOrders,
    getOrderById,
    getAllOrders,
    updateOrder,
    deleteOrder,
    proposePrice,
    acceptPrice,
    getOrderMessages,
    sendOrderMessage
};
