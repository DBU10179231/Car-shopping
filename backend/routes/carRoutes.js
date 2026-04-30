const express = require('express');
const router = express.Router();
const { getCars, getCarById, createCar, updateCar, deleteCar, getMakes } = require('../controllers/carController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/makes', getMakes);
router.get('/', getCars);
router.get('/:id', getCarById);
router.post('/', protect, upload.array('images', 10), createCar);
router.put('/:id', protect, upload.array('images', 10), updateCar);
router.delete('/:id', protect, deleteCar);

module.exports = router;
