const mongoose = require('mongoose');
const Order = require('./models/Order');
const Car = require('./models/Car');
const User = require('./models/User');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const debug = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const query = {};
        const orders = await Order.find(query)
            .populate('user', 'name email')
            .populate('car', 'make model year images price')
            .sort({ createdAt: -1 });

        console.log(`Found ${orders.length} orders`);
        console.log('Orders JSON length:', JSON.stringify({ orders }).length);

        process.exit(0);
    } catch (err) {
        console.error('Debug Error:', err.message);
        process.exit(1);
    }
};

debug();
