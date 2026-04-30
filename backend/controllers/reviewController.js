const Review = require('../models/Review');
const Car = require('../models/Car');

// @desc    Add review
// @route   POST /api/reviews/:carId
const addReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const existing = await Review.findOne({ user: req.user._id, car: req.params.carId });
        if (existing) return res.status(400).json({ message: 'You already reviewed this car' });

        const review = await Review.create({ user: req.user._id, car: req.params.carId, rating, comment });

        // Update car average rating
        const reviews = await Review.find({ car: req.params.carId });
        const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        await Car.findByIdAndUpdate(req.params.carId, { rating: avg.toFixed(1), numReviews: reviews.length });

        res.status(201).json(review);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get reviews for a car
// @route   GET /api/reviews/:carId
const getReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ car: req.params.carId }).populate('user', 'name');
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { addReview, getReviews };
