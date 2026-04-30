const mongoose = require('mongoose');

const logisticsSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    car: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Car',
        required: true
    },
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    trackingNumber: {
        type: String,
        required: true,
        unique: true
    },
    serviceProvider: {
        type: String,
        default: 'AutoMarket Logistics'
    },
    status: {
        type: String,
        enum: ['pending_pickup', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled'],
        default: 'pending_pickup'
    },
    pickupDetails: {
        address: String,
        scheduledDate: Date,
        scheduledTime: String,
        actualPickupDate: Date
    },
    deliveryDetails: {
        address: String,
        estimatedArrival: Date,
        actualArrivalDate: Date
    },
    currentLocation: String,
    history: [
        {
            status: String,
            location: String,
            comment: String,
            updatedAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    shippingQuote: {
        amount: Number,
        currency: { type: String, default: 'ETB' }
    }
}, { timestamps: true });

module.exports = mongoose.model('Logistics', logisticsSchema);
