const mongoose = require('mongoose');
const paymentController = require('./controllers/paymentController');

mongoose.connect('mongodb://localhost:27017/carshoppingdb').then(async () => {
    const Order = require('./models/Order');
    const Car = require('./models/Car');
    const User = require('./models/User');

    const car = await Car.findOne();
    const user = await User.findOne();

    console.log('Testing Checkout with User ID:', user._id);

    const req = {
        body: {
            carId: car._id,
            amount: 5000,
            paymentMethod: 'chapa'
        },
        user: user
    };

    const res = {
        json: (data) => console.log('✅ SUCCESS:', data),
        status: (code) => ({
            json: (data) => console.error(`❌ HTTP ${code}:`, data)
        })
    };

    await paymentController.checkout(req, res);
    process.exit(0);
}).catch(console.error);
