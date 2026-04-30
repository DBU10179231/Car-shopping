const mongoose = require('mongoose');
const Order = require('c:\\Users\\Lab\\Desktop\\car shopping system\\backend\\models\\Order');
const Car = require('c:\\Users\\Lab\\Desktop\\car shopping system\\backend\\models\\Car');

const uri = 'mongodb://127.0.0.1:27017/carshoppingdb';

mongoose.connect(uri)
    .then(async () => {
        console.log('Connected to MongoDB');
        const orderId = '69b2e4998ee2c5354c6aabd9';
        console.log(`Checking Order with ID: ${orderId}`);
        
        try {
            const orderCount = await Order.countDocuments();
            console.log('Total orders in DB:', orderCount);

            const order = await Order.findById(orderId).populate({
                path: 'car',
                populate: { path: 'seller' }
            });
            console.log('Order Details:', JSON.stringify(order, null, 2));
            
            if (order && !order.car) {
                console.log('WARNING: Car is null for this order!');
                const rawOrder = await Order.findById(orderId);
                console.log('Raw Order (no population):', rawOrder);
            }
        } catch(e) { console.log('Error searching order:', e.message); }

        process.exit(0);
    })
    .catch(err => {
        console.error('Connection Error:', err.message);
        process.exit(1);
    });
