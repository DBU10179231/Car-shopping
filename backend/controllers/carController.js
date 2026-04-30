const Car = require('../models/Car');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Utility to create an audit log entry (replicated from adminController for simplicity, or we could move to utils)
const logAction = async (req, action, targetType, targetId, details = '') => {
    try {
        await AuditLog.create({
            adminId: req.user._id,
            action,
            targetType,
            targetId,
            details,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });
    } catch (err) {
        console.error('Audit Log Error:', err);
    }
};

// @desc    Get all cars (with filter, search, pagination)
// @route   GET /api/cars
const getCars = async (req, res) => {
    try {
        const { make, category, fuelType, transmission, minPrice, maxPrice, minYear, maxYear, search, location, sort, page = 1, limit = 9, condition, sellerType } = req.query;

        const query = { available: true, status: 'active' };
        if (make) query.make = new RegExp(make, 'i');
        if (category) query.category = category;
        if (fuelType) query.fuelType = fuelType;
        if (transmission) query.transmission = transmission;
        if (condition) query.condition = condition;
        if (location) query.location = new RegExp(location, 'i');

        if (sellerType) {
            let roles = [];
            if (sellerType === 'Private') roles = ['user'];
            else if (sellerType === 'Dealership') roles = ['dealer'];
            else if (sellerType === 'Broker') roles = ['dealer']; // Simplify to dealer role

            if (roles.length > 0) {
                const users = await User.find({ role: { $in: roles } }).select('_id');
                query.seller = { $in: users.map(u => u._id) };
            }
        }

        if (minPrice || maxPrice) query.price = {};
        if (minPrice) query.price.$gte = Number(minPrice);
        if (maxPrice) query.price.$lte = Number(maxPrice);

        if (minYear || maxYear) query.year = {};
        if (minYear) query.year.$gte = Number(minYear);
        if (maxYear) query.year.$lte = Number(maxYear);

        if (search) {
            query.$or = [
                { make: new RegExp(search, 'i') },
                { model: new RegExp(search, 'i') },
                { description: new RegExp(search, 'i') },
            ];
        }

        // Sorting Logic
        let sortQuery = { createdAt: -1 };
        if (sort === 'price_asc') sortQuery = { price: 1 };
        else if (sort === 'price_desc') sortQuery = { price: -1 };
        else if (sort === 'year_desc') sortQuery = { year: -1 };
        else if (sort === 'mileage_asc') sortQuery = { mileage: 1 };

        const skip = (page - 1) * limit;
        const total = await Car.countDocuments(query);
        const cars = await Car.find(query).skip(skip).limit(Number(limit)).sort(sortQuery);

        res.json({ cars, total, page: Number(page), pages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get single car by ID (public-friendly — optional auth for owner/admin preview)
// @route   GET /api/cars/:id
const getCarById = async (req, res) => {
    try {
        const id = req.params.id?.trim();
        
        // TEMPORARY REDIRECT FOR LEGACY IDs (from previous seeder runs)
        // This helps users recover if they have old tabs/tabs open.
        if (id && id.startsWith('69b316')) {
            return res.status(410).json({ 
                redirect: '/', 
                message: 'This vehicle listing was updated. Redirecting to home...' 
            });
        }
        
        // Basic ID validation to prevent CastError 500s
        if (!id || id.length !== 24) {
            return res.status(400).json({ message: 'Invalid Car ID format' });
        }

        const car = await Car.findById(id).populate('seller', 'name email role avatar profilePhoto isVerifiedSeller');
        
        if (!car) {
            return res.status(404).json({ message: 'Car not found' });
        }

        // Determine if requester is owner or admin (token is optional on this route)
        let isOwnerOrAdmin = false;
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer')) {
            try {
                const token = authHeader.split(' ')[1];
                if (token && token !== 'null' && token !== 'undefined') {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    if (decoded && decoded.id) {
                        const requestUser = await User.findById(decoded.id).select('_id role status');
                        if (requestUser && requestUser.status !== 'banned') {
                            isOwnerOrAdmin =
                                requestUser.role === 'admin' ||
                                requestUser.role === 'super_admin' ||
                                (car.seller && car.seller._id.toString() === requestUser._id.toString());
                        }
                    }
                }
            } catch (jwtErr) {
                // Invalid token is fine here — treat as guest
            }
        }

        // Guests can only see 'active' or 'sold' cars
        const isPubliclyViewable = ['active', 'sold'].includes(car.status);
        if (!isOwnerOrAdmin && !isPubliclyViewable) {
            return res.status(404).json({ message: 'This listing is not currently available' });
        }

        // Increment view count for public views
        if (!isOwnerOrAdmin) {
            await Car.findByIdAndUpdate(id, { $inc: { views: 1 } });
        }

        res.json(car);
    } catch (err) {
        console.error('getCarById Error:', err);
        res.status(500).json({ 
            message: 'Internal Server Error',
            error: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
};

// @desc    Create new car
// @route   POST /api/cars
const createCar = async (req, res) => {
    try {
        let carData = { ...req.body };

        // Handle images if uploaded
        if (req.files && req.files.length > 0) {
            carData.images = req.files.map(file => `/uploads/${file.filename}`);
        }

        // Parse features if sent as string
        if (typeof carData.features === 'string') {
            try { carData.features = JSON.parse(carData.features); }
            catch (e) { carData.features = carData.features.split(',').map(f => f.trim()); }
        }

        // Force status to pending if not admin
        if (req.user.role !== 'admin') {
            carData.status = 'pending';
        }

        const car = await Car.create({ ...carData, seller: req.user._id });

        await logAction(req, 'CREATE_LISTING', 'car', car._id, `Created vehicle listing: ${car.make} ${car.model}`);

        res.status(201).json(car);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Update car
// @route   PUT /api/cars/:id
const updateCar = async (req, res) => {
    try {
        let updateData = { ...req.body };
        const car = await Car.findById(req.params.id);

        if (!car) return res.status(404).json({ message: 'Car not found' });

        // Ownership check: bypass if admin or super_admin
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin' && car.seller.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to edit this listing' });
        }

        // Handle images if uploaded
        if (req.files && req.files.length > 0) {
            updateData.images = req.files.map(file => `/uploads/${file.filename}`);
        }

        // Parse features if sent as string
        if (typeof updateData.features === 'string') {
            try { updateData.features = JSON.parse(updateData.features); }
            catch (e) { updateData.features = updateData.features.split(',').map(f => f.trim()); }
        }

        // If seller updates, set back to pending (if it was rejected or active)
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin' && (car.status === 'active' || car.status === 'rejected')) {
            updateData.status = 'pending';
        }

        const updatedCar = await Car.findByIdAndUpdate(req.params.id, updateData, { new: true });

        await logAction(req, 'UPDATE_LISTING', 'car', car._id, `Updated vehicle listing details`);

        res.json(updatedCar);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Delete car
// @route   DELETE /api/cars/:id
const deleteCar = async (req, res) => {
    try {
        const car = await Car.findById(req.params.id);
        if (!car) return res.status(404).json({ message: 'Car not found' });

        // Ownership check: bypass if admin or super_admin
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin' && car.seller.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this listing' });
        }

        await Car.findByIdAndDelete(req.params.id);

        await logAction(req, 'DELETE_LISTING', 'car', car._id, `Deleted vehicle listing: ${car.make} ${car.model}`);

        res.json({ message: 'Car removed' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get distinct makes for filter
// @route   GET /api/cars/makes
const getMakes = async (req, res) => {
    try {
        const makes = await Car.distinct('make');
        res.json(makes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getCars, getCarById, createCar, updateCar, deleteCar, getMakes };
