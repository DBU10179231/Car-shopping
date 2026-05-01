const mongoose = require('mongoose');
const Order = require('./models/Order');
const Car = require('./models/Car'); // Fixed: Added Car model
const User = require('./models/User');
const Message = require('./models/Message');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const debug = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const query = {};
        const orders = await Order.find(query)
            .populate('user', 'name email phone role profilePhoto')
            .populate('car', 'make model year price images')
            .sort({ createdAt: -1 });

        console.log(`Found ${orders.length} orders`);

        const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } }).select('_id');
        const adminIds = admins.map(a => a._id.toString());
        console.log('Admin IDs:', adminIds);

        const ordersWithUnread = await Promise.all(orders.map(async (order) => {
            try {
                const unreadCount = await Message.countDocuments({
                    order: order._id,
                    sender: { $nin: adminIds },
                    isRead: false
                });
                return { ...order._doc, unreadMessages: unreadCount };
            } catch (err) {
                console.error(`Error processing order ${order._id}:`, err.message);
                throw err;
            }
        }));

        console.log('Successfully processed all orders');
        process.exit(0);
    } catch (err) {
        console.error('Debug Error:', err.message);
        process.exit(1);
    }
};

debug();
