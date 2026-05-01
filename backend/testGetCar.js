const mongoose = require('mongoose');
const Car = require('./models/Car');
const User = require('./models/User');
const { getCarById } = require('./controllers/carController');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const test = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const car = await Car.findOne();
        if (!car) throw new Error('No car found');

        const req = {
            params: { id: car._id.toString() },
            headers: {}
        };

        const res = {
            json: (data) => {
                console.log('Success! Returned car:', data.make, data.model);
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

        await getCarById(req, res);
    } catch (err) {
        console.error('Test Error:', err.message);
        process.exit(1);
    }
};

test();
