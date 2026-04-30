const mongoose = require('mongoose');
const Order = require('../models/Order');

async function dumpOrders() {
    try {
        await mongoose.connect('mongodb://localhost:27017/carshoppingdb');
        const orders = await Order.find().sort({ createdAt: -1 }).limit(5);
        console.log('--- Last 5 Orders ---');
        orders.forEach(o => {
            console.log(`ID: ${o._id}`);
            console.log(`tx_ref: ${o.tx_ref}`);
            console.log(`transactionId: ${o.transactionId}`);
            console.log(`paymentStatus: ${o.paymentStatus}`);
            console.log('-------------------');
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

dumpOrders();
