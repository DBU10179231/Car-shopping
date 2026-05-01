const mongoose = require('mongoose');
const Order = require('./models/Order');
const User = require('./models/User');
const Car = require('./models/Car');
const Message = require('./models/Message');
const { getAllOrders } = require('./controllers/orderController');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const test = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // Mock req and res
        const adminUser = await User.findOne({ role: 'super_admin' });
        if (!adminUser) throw new Error('No admin user found');

        const req = {
            query: {},
            user: adminUser
        };

        const res = {
            json: (data) => {
                console.log('Success! Returned data length:', Array.isArray(data) ? data.length : 'not an array');
                process.exit(0);
            },
            status: (code) => {
                console.log('Error Code:', code);
                return {
                    json: (data) => {
                        console.log('Error Data:', data);
                        process.exit(1);
                    }
                };
            }
        };

        await getAllOrders(req, res);
    } catch (err) {
        console.error('Test Error:', err.message);
        process.exit(1);
    }
};

test();
