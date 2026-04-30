const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
    make: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    year: { type: Number, required: true },
    price: { type: Number, required: true },
    mileage: { type: Number, default: 0 },
    fuelType: { type: String, enum: ['Gasoline', 'Diesel', 'Electric', 'Hybrid'], default: 'Gasoline' },
    transmission: { type: String, enum: ['Automatic', 'Manual'], default: 'Automatic' },
    category: { type: String, enum: ['Sedan', 'SUV', 'Truck', 'Coupe', 'Hatchback', 'Van', 'Convertible', 'Electric'], default: 'Sedan' },
    engine: { type: String, default: '' },
    engineSize: { type: String, default: '' },
    driveType: { type: String, enum: ['FWD', 'RWD', 'AWD', '4WD'], default: 'FWD' },
    condition: { type: String, enum: ['New', 'Used', 'Certified Pre-Owned'], default: 'Used' },
    registration: { type: String, default: '' },
    color: { type: String, default: 'White' },
    location: { type: String, default: 'Addis Ababa' },
    images: [{ type: String }],
    features: [{ type: String }],
    available: { type: Boolean, default: true },
    status: { type: String, enum: ['pending', 'active', 'sold', 'expired', 'rejected', 'reserved'], default: 'pending' },
    rejectReason: { type: String, default: '' },
    views: { type: Number, default: 0 },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    featuredExpiry: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Car', carSchema);
