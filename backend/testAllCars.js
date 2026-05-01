const mongoose = require('mongoose');
const Car = require('./models/Car');
const User = require('./models/User');
const { getCarById } = require('./controllers/carController');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const testAll = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const cars = await Car.find();
        console.log(`Testing ${cars.length} cars...`);

        for (const car of cars) {
            const req = {
                params: { id: car._id.toString() },
                headers: {}
            };

            const res = {
                json: (data) => {},
                status: (code) => {
                    if (code === 500) {
                        console.log(`CRASH detected for car ${car._id}: ${car.make} ${car.model}`);
                        process.exit(1);
                    }
                    return { json: (data) => {} };
                }
            };

            try {
                await getCarById(req, res);
            } catch (err) {
                console.log(`UNCAUGHT CRASH for car ${car._id}: ${err.message}`);
                process.exit(1);
            }
        }

        console.log('All cars tested successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Test Error:', err.message);
        process.exit(1);
    }
};

testAll();
