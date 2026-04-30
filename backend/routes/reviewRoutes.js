const express = require('express');
const router = express.Router();
const { addReview, getReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.get('/:carId', getReviews);
router.post('/:carId', protect, addReview);

module.exports = router;
