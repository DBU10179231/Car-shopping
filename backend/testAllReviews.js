const mongoose = require('mongoose');
const Car = require('./models/Car');
const Review = require('./models/Review');
const { getReviews } = require('./controllers/reviewController');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const testReviews = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const cars = await Car.find();
        for (const car of cars) {
            const req = { params: { carId: car._id.toString() } };
            const res = {
                json: (data) => {},
                status: (code) => {
                    if (code === 500) {
                        console.log(`CRASH detected for reviews of car ${car._id}`);
                        process.exit(1);
                    }
                    return { json: (data) => {} };
                }
            };
            await getReviews(req, res);
        }

        console.log('All reviews tested successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Test Error:', err.message);
        process.exit(1);
    }
};

testReviews();
