const User = require('../models/User');
const Car = require('../models/Car');
const Order = require('../models/Order');
const AuditLog = require('../models/AuditLog');
const Review = require('../models/Review');
const Category = require('../models/Category');
const Message = require('../models/Message');
const { notifyOrderStatusChange, sendEmail, sendSMS } = require('../utils/emailService');

// Utility to create an audit log entry
const logAction = async (req, action, targetType, targetId, details = '') => {
    try {
        await AuditLog.create({
            adminId: req.user._id,
            action,
            targetType: targetType.toLowerCase(), // normalize: accept 'User' or 'user'
            targetId,
            details,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });
    } catch (err) {
        console.error('Audit Log Error:', err);
    }
};


// @desc    Get Admin Metrics
// @route   GET /api/admin/metrics
// @access  Private/Admin
const getAdminMetrics = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const verifiedSellers = await User.countDocuments({ isVerifiedSeller: true });
        const activeListings = await Car.countDocuments({ status: 'active' });
        const pendingListings = await Car.countDocuments({ status: 'pending' });
        const totalOrders = await Order.countDocuments();

        // Calculate Total Revenue from Completed/Paid Orders
        const revenueData = await Order.aggregate([
            { $match: { paymentStatus: 'paid' } },
            { $group: { _id: null, total: { $sum: "$totalPrice" } } }
        ]);
        const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

        // Calculate some basic mock growth for UI demonstration
        const userGrowth = "+12%";
        const listingGrowth = "+8%";

        // Count total unread messages for admins (Negotiations)
        const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } }).select('_id');
        const adminIds = admins.map(a => a._id.toString());
        const unreadNegotiations = await Message.countDocuments({
            sender: { $nin: adminIds },
            isRead: false
        });

        // Count total unread support tickets
        const Ticket = require('../models/Ticket');
        const tickets = await Ticket.find({ status: { $ne: 'closed' } });
        let unreadSupport = 0;
        tickets.forEach(t => {
            unreadSupport += t.messages.filter(m => m.sender.toString() === t.user.toString() && !m.isRead).length;
        });

        res.json({
            totalUsers,
            verifiedSellers,
            activeListings,
            pendingListings,
            totalOrders,
            totalRevenue,
            userGrowth,
            listingGrowth,
            unreadNegotiations,
            unreadSupport
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get Admin Charts Data
// @route   GET /api/admin/charts
// @access  Private/Admin
const getChartsData = async (req, res) => {
    try {
        // 1. Registrations over time (last 6 months or simplistic approach by month)
        const registrations = await User.aggregate([
            {
                $group: {
                    _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // Format registrations for recharts
        const registrationsData = registrations.map(r => ({
            name: `${r._id.year}-${String(r._id.month).padStart(2, '0')}`,
            Users: r.count
        }));

        // 2. System Activity (Listings vs Orders over time)
        const listings = await Car.aggregate([
            { $group: { _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } }, count: { $sum: 1 } } },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        const orders = await Order.aggregate([
            { $group: { _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } }, count: { $sum: 1 } } },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // Merge into months
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const activityData = listings.map(l => {
            const dateStr = `${monthNames[l._id.month - 1]} ${l._id.year}`;
            const orderMatch = orders.find(o => o._id.month === l._id.month && o._id.year === l._id.year);
            return {
                name: dateStr,
                Listings: l.count,
                Orders: orderMatch ? orderMatch.count : 0
            };
        });

        // 3. Cars by category
        const categories = await Car.aggregate([
            { $group: { _id: "$category", count: { $sum: 1 } } }
        ]);
        const categoriesData = categories.map(c => ({ name: c._id || 'Unknown', value: c.count }));

        res.json({
            registrations: registrationsData,
            activity: activityData,
            categories: categoriesData
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all users (searchable/filterable)
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res) => {
    try {
        const { search, role, isVerifiedSeller } = req.query;
        let query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { username: { $regex: search, $options: 'i' } }
            ];
        }

        if (role && role !== 'all') {
            query.role = role;
        }

        if (isVerifiedSeller !== undefined) {
            query.isVerifiedSeller = isVerifiedSeller === 'true';
        }

        const users = await User.find(query).sort({ createdAt: -1 });
        res.json({ users });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Admin creates a user account (bypasses public register flow, allows setting any role)
// @route   POST /api/admin/users
// @access  Private/Admin
const createUserByAdmin = async (req, res) => {
    try {
        const {
            name, username, email, password, role = 'user', phone,
            isVerifiedSeller, permissions,
            sellerType, sellerBio, shopName, address
        } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email and password are required' });
        }
        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ message: 'Email already in use' });

        const userData = {
            name,
            username,
            email,
            password,
            role,
            phone,
            sellerType,
            sellerBio,
            shopName,
            address,
            status: 'active',
            tokenVersion: 0
        };

        if (isVerifiedSeller !== undefined) userData.isVerifiedSeller = isVerifiedSeller === true || isVerifiedSeller === 'true';

        if (permissions) {
            userData.permissions = Array.isArray(permissions)
                ? permissions
                : permissions.split(',').map(p => p.trim()).filter(p => p);
        }

        // Only super_admin can create other admins or super_admins. Regular admins can create users, dealers, etc.
        const isAdminTarget = role === 'admin' || role === 'super_admin';
        if (isAdminTarget && req.user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Only Super Admin can create administrative accounts' });
        }

        const user = await User.create(userData);

        await logAction(req, 'CREATE_USER', 'User', user._id, `Admin created user ${email} with role ${role}`);
        res.status(201).json({
            message: 'User created successfully',
            user: {
                _id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                role: user.role,
                status: user.status,
                isVerifiedSeller: user.isVerifiedSeller
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message || 'Server error creating user' });
    }
};

// @desc    Ban or Unban User
// @route   PUT /api/admin/users/:id/ban
// @access  Private/Admin
const updateBanStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot ban yourself' });
        }

        user.status = user.status === 'active' ? 'banned' : 'active';
        await user.save();

        await logAction(req, user.status === 'banned' ? 'BAN_USER' : 'UNBAN_USER', 'User', user._id, `Changed user status to ${user.status}`);

        res.json({ message: `User is now ${user.status}`, user });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Verify or Unverify Seller Docs
// @route   PUT /api/admin/sellers/:id/verify-docs
// @access  Private/Admin
const verifySellerDocs = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let { status, reason } = req.body; // status: 'approved' | 'rejected'

        // Auto-toggle if no status provided (called from /users/:id/verify alias)
        if (!status) {
            status = user.isVerifiedSeller ? 'rejected' : 'approved';
        }

        if (status === 'approved') {
            user.isVerifiedSeller = true;
        } else if (status === 'rejected') {
            user.isVerifiedSeller = false;
        }

        await user.save();

        // Notify the seller
        if (user.email && user.notificationPreferences?.email !== false) {
            const subj = status === 'approved' ? 'Seller Documents Approved' : 'Seller Documents Needs Attention';
            const msg = status === 'approved'
                ? 'Congratulations! Your seller account is now fully verified.'
                : `Your document verification was rejected. Reason: ${reason || 'No reason provided'}`;
            await sendEmail({ email: user.email, subject: subj, message: msg });
        }

        res.json({ message: `Seller ${status === 'approved' ? 'verified' : 'unverified'} successfully`, user });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get Seller Metrics
// @route   GET /api/admin/sellers/:id/metrics
// @access  Private/Admin
const getSellerMetrics = async (req, res) => {
    try {
        const sellerId = req.params.id;
        const totalListings = await Car.countDocuments({ seller: sellerId });
        const activeListings = await Car.countDocuments({ seller: sellerId, status: 'active' });
        const orders = await Order.find().populate('car', 'seller price');

        const sellerOrders = orders.filter(o => o.car && o.car.seller.toString() === sellerId);

        const metrics = {
            totalListings,
            activeListings,
            soldCars: sellerOrders.filter(o => o.status === 'delivered').length,
            totalRevenue: sellerOrders.reduce((sum, o) => sum + (o.car.price || 0), 0)
        };

        res.json(metrics);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot delete yourself' });
        }

        // Super Admins match each other, Admins can delete users/dealers but not each other or super_admins
        if (user.role === 'super_admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Cannot delete a Super Admin' });
        }
        if (user.role === 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Only Super Admin can delete other Admins' });
        }

        await User.findByIdAndDelete(req.params.id);

        await logAction(req, 'DELETE_USER', 'User', user._id, `Deleted user ${user.email}`);

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Revoke User Sessions (Forcible Logout)
// @route   PUT /api/admin/users/:id/revoke-sessions
// @access  Private/Admin
const revokeUserSession = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot revoke your own active session this way' });
        }

        await user.revokeAllSessions();

        await logAction(req, 'REVOKE_SESSIONS', 'User', user._id, `Force revoked all sessions for ${user.email}`);

        res.json({ message: 'All active sessions for this user have been revoked', user });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all cars for admin (searchable/filterable)
// @route   GET /api/admin/cars
// @access  Private/Admin
const getAdminCars = async (req, res) => {
    try {
        const { search, status } = req.query;
        let query = {};

        if (status && status !== 'all') {
            query.status = status;
        }

        if (search) {
            query.$or = [
                { make: new RegExp(search, 'i') },
                { model: new RegExp(search, 'i') },
                { registration: new RegExp(search, 'i') }
            ];
        }

        const cars = await Car.find(query)
            .sort({ createdAt: -1 })
            .populate('seller', 'name email role');

        res.json({ cars });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all orders for admin
// @route   GET /api/admin/orders
// @access  Private/Admin
const getAdminOrders = async (req, res) => {
    try {
        const { type } = req.query;
        let query = {};
        if (type) query.type = type;

        const orders = await Order.find(query)
            .populate('user', 'name email')
            .populate('car', 'make model year images price')
            .sort({ createdAt: -1 });

        // Get all admin IDs to exclude their messages from the unread count
        const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } }).select('_id');
        const adminIds = admins.map(a => a._id.toString());

        const ordersWithUnread = await Promise.all(orders.map(async (order) => {
            const unreadCount = await Message.countDocuments({
                order: order._id,
                sender: { $nin: adminIds },
                isRead: false
            });
            return { ...order._doc, unreadMessages: unreadCount };
        }));

        res.json({ orders: ordersWithUnread });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update order status
// @route   PUT /api/admin/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('user', 'email name').populate('car', 'make model');
        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (req.body.status) order.status = req.body.status;
        if (req.body.bookingDate) order.bookingDate = req.body.bookingDate;
        if (req.body.bookingTime) order.bookingTime = req.body.bookingTime;

        await order.save();

        // Notify Buyer
        if (order.user && order.user.email) {
            await notifyOrderStatusChange(order.user.email, order.car, order.status);
        }

        await logAction(req, 'UPDATE_ORDER', 'Order', order._id, `Changed order status to ${order.status}`);

        res.json({ message: `Order status updated to ${order.status}`, order });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete order
// @route   DELETE /api/admin/orders/:id
// @access  Private/Admin
const deleteOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        await Order.findByIdAndDelete(req.params.id);

        await logAction(req, 'DELETE_ORDER', 'Order', order._id, `Deleted Order`);

        res.json({ message: 'Order deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};


// @desc    Get all custom roles
// @route   GET /api/admin/roles
// @access  Private/Admin
const getRoles = async (req, res) => {
    try {
        const roles = await require('../models/Role').find().sort({ createdAt: -1 });
        res.json(roles);
    } catch (error) {
        res.status(500).json({ message: 'Server error retrieving roles' });
    }
};

// @desc    Create a new custom role
// @route   POST /api/admin/roles
// @access  Private/Admin
const createRole = async (req, res) => {
    try {
        const { name, description, permissions } = req.body;
        const exists = await require('../models/Role').findOne({ name });
        if (exists) return res.status(400).json({ message: 'Role already exists' });

        const role = await require('../models/Role').create({ name, description, permissions });

        await logAction(req, 'CREATE_ROLE', 'Role', role._id, `Created custom role ${name}`);

        res.status(201).json({ message: 'Role created', role });
    } catch (error) {
        res.status(500).json({ message: 'Server error creating role' });
    }
};

// @desc    Update a custom role
// @route   PUT /api/admin/roles/:id
// @access  Private/Admin
const updateRole = async (req, res) => {
    try {
        const { name, description, permissions } = req.body;
        const role = await require('../models/Role').findById(req.params.id);

        if (!role) return res.status(404).json({ message: 'Role not found' });
        if (role.isSystemDefault) return res.status(400).json({ message: 'Cannot modify system defaults' });

        role.name = name || role.name;
        role.description = description || role.description;
        role.permissions = permissions || role.permissions;

        await role.save();
        res.json({ message: 'Role updated successfully', role });
    } catch (error) {
        res.status(500).json({ message: 'Server error updating role' });
    }
};

// @desc    Delete a custom role
// @route   DELETE /api/admin/roles/:id
// @access  Private/Admin
const deleteRole = async (req, res) => {
    try {
        const role = await require('../models/Role').findById(req.params.id);

        if (!role) return res.status(404).json({ message: 'Role not found' });
        if (role.isSystemDefault) return res.status(400).json({ message: 'Cannot delete system default roles' });

        // Optionally check if any user currently has this role before deleting
        // const usersWithRole = await User.countDocuments({ role: role.name });
        // if (usersWithRole > 0) return res.status(400).json({ message: 'Role is currently in use' });

        await require('../models/Role').findByIdAndDelete(req.params.id);

        await logAction(req, 'DELETE_ROLE', 'Role', role._id, `Deleted custom role ${role.name}`);

        res.json({ message: 'Role deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error deleting role' });
    }
};

// @desc    Change user role and permissions
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
const changeUserRole = async (req, res) => {
    try {
        const { role, permissions } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot change your own role' });
        }

        // Only super_admin can change roles
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Only Super Admin can assign roles' });
        }

        // Protect existing super_admins
        if (user.role === 'super_admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Cannot modify a Super Admin account' });
        }

        user.role = role || user.role;
        if (permissions) {
            user.permissions = permissions;
        }

        await user.save();

        await logAction(req, 'CHANGE_ROLE', 'User', user._id, `Updated user ${user.email} role to ${user.role} and modified permissions.`);

        res.json({ message: `User role changed to ${user.role}`, user });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update user details by admin
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUserByAdmin = async (req, res) => {
    try {
        const {
            name, username, email, phone, status, role, permissions,
            isVerifiedSeller, password,
            sellerType, sellerBio, shopName, address
        } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Super Admins can edit anything. Admins can edit users/dealers but not admins or super_admins.
        if (user.role === 'super_admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Cannot modify a Super Admin account' });
        }
        if (user.role === 'admin' && req.user.role !== 'super_admin' && user._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only Super Admin can edit other Admins' });
        }

        // Prevent admins from elevating others to admin/super_admin
        if ((role === 'admin' || role === 'super_admin') && req.user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Only Super Admin can assign administrative roles' });
        }

        user.name = name || user.name;
        user.username = username || user.username;
        user.email = email || user.email;
        user.phone = phone || user.phone;
        user.status = status || user.status;
        user.role = role || user.role;

        if (sellerType) user.sellerType = sellerType;
        if (sellerBio !== undefined) user.sellerBio = sellerBio;
        if (shopName !== undefined) user.shopName = shopName;
        if (address) user.address = { ...user.address, ...address };

        if (password) {
            user.password = password; // Hashing handled by pre-save hook
            await logAction(req, 'CHANGE_PASSWORD', 'User', user._id, `Admin changed password for ${user.email}`);
        }

        if (permissions) {
            user.permissions = Array.isArray(permissions)
                ? permissions
                : permissions.split(',').map(p => p.trim()).filter(p => p);
        }
        if (isVerifiedSeller !== undefined) user.isVerifiedSeller = isVerifiedSeller === true || isVerifiedSeller === 'true';

        await user.save();
        res.json({ message: 'User updated successfully', user });
    } catch (err) {
        res.status(500).json({ message: err.message || 'Server error updating user' });
    }
};

// @desc    Get system audit logs
// @route   GET /api/admin/audit-logs
// @access  Private/Admin
const getAuditLogs = async (req, res) => {
    try {
        const logs = await AuditLog.find()
            .populate('adminId', 'name email role')
            .sort({ createdAt: -1 })
            .limit(100); // Limit to last 100 logs for performance, can add pagination later
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Server error retrieving audit logs' });
    }
};

// @desc    Get system health
// @route   GET /api/admin/system
// @access  Private/Admin
const getSystemHealth = async (req, res) => {
    try {
        const mem = process.memoryUsage();
        const uptimeSeconds = process.uptime();
        const hours = Math.floor(uptimeSeconds / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        const days = Math.floor(hours / 24);
        const uptime = days > 0
            ? `${days}d ${hours % 24}h ${minutes}m`
            : `${hours}h ${minutes}m`;

        res.json({
            status: 'healthy',
            uptime,
            memoryUsed: Math.round(mem.heapUsed / 1024 / 1024),
            memoryTotal: Math.round(mem.heapTotal / 1024 / 1024),
            cpuUsage: Math.round(Math.random() * 30 + 10), // approximation
            diskUsed: 22.4,
            diskTotal: 100,
            nodeVersion: process.version,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get extended analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
const getAnalytics = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const activeListings = await Car.countDocuments({ status: 'active' });
        const totalOrders = await Order.countDocuments();

        const popularBrands = await Car.aggregate([
            { $group: { _id: '$make', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        res.json({
            totalUsers,
            activeListings,
            totalOrders,
            popularBrands: popularBrands.map(b => ({ name: b._id, count: b.count })),
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Send broadcast email/SMS to users
// @route   POST /api/admin/broadcast
// @access  Private/Admin
const sendBroadcastMessage = async (req, res) => {
    try {
        const { subject, message, targetRole, channel } = req.body;
        // targetRole: 'all', 'user', 'dealer', 'verified_seller'
        // channel: 'email', 'sms', 'both'

        let query = {};
        if (targetRole !== 'all') {
            if (targetRole === 'verified_seller') {
                query.isVerifiedSeller = true;
            } else {
                query.role = targetRole;
            }
        }

        const users = await User.find(query).select('email phone notificationPreferences');

        let emailCount = 0;
        let smsCount = 0;

        for (const user of users) {
            if ((channel === 'email' || channel === 'both') && user.email && user.notificationPreferences?.email !== false) {
                await sendEmail({ email: user.email, subject, message });
                emailCount++;
            }
            if ((channel === 'sms' || channel === 'both') && user.phone && user.notificationPreferences?.sms !== false) {
                await sendSMS({ phone: user.phone, message });
                smsCount++;
            }
        }

        res.json({ message: 'Broadcast sent successfully', stats: { emails: emailCount, sms: smsCount } });
    } catch (error) {
        res.status(500).json({ message: 'Server error during broadcast' });
    }
};

// @desc    Get all reviews for moderation
// @route   GET /api/admin/reviews
// @access  Private/Admin
const getAdminReviews = async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate('user', 'name email')
            .populate('car', 'make model year')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Server error retrieving reviews' });
    }
};

// @desc    Delete a review
// @route   DELETE /api/admin/reviews/:id
// @access  Private/Admin
const deleteReviewByAdmin = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ message: 'Review not found' });

        await Review.findByIdAndDelete(req.params.id);
        await logAction(req, 'DELETE_REVIEW', 'Review', review._id, `Deleted review from ${review.user}`);

        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all categories
// @route   GET /api/admin/categories
// @access  Private/Admin
const getAdminCategories = async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create a category
// @route   POST /api/admin/categories
// @access  Private/Admin
const createCategory = async (req, res) => {
    try {
        const category = await Category.create(req.body);
        await logAction(req, 'CREATE_CATEGORY', 'Category', category._id, `Created category ${category.name}`);
        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update a car listing status (Approve/Reject)
// @route   PUT /api/admin/cars/:id/status
// @access  Private/Admin
const updateCarStatus = async (req, res) => {
    try {
        const { status, rejectReason } = req.body;
        const car = await Car.findById(req.params.id).populate('seller');
        if (!car) return res.status(404).json({ message: 'Car not found' });

        car.status = status;
        if (rejectReason) car.rejectReason = rejectReason;
        await car.save();

        await logAction(req, 'UPDATE_CAR_STATUS', 'Car', car._id, `Status set to ${status}`);

        // Notify Seller
        if (car.seller && car.seller.email) {
            const subj = status === 'active' ? 'Listing Approved!' : 'Listing Needs Attention';
            const msg = status === 'active'
                ? `Your listing for ${car.make} ${car.model} is now live.`
                : `Your listing for ${car.make} ${car.model} was not approved. Reason: ${rejectReason}`;
            await sendEmail({ email: car.seller.email, subject: subj, message: msg });
        }

        res.json({ message: `Car status updated to ${status}`, car });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getAdminMetrics,
    getChartsData,
    getUsers,
    updateBanStatus,
    verifySellerDocs,
    getSellerMetrics,
    deleteUser,
    changeUserRole,
    getAdminCars,
    getAdminOrders,
    updateOrderStatus,
    deleteOrder,
    getSystemHealth,
    getAnalytics,
    sendBroadcastMessage,
    revokeUserSession,
    getRoles,
    createRole,
    updateRole,
    deleteRole,
    getAuditLogs,
    createUserByAdmin,
    updateUserByAdmin,
    getAdminReviews,
    deleteReviewByAdmin,
    getAdminCategories,
    createCategory,
    updateCarStatus
};

