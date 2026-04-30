const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    car: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
    type: { type: String, enum: ['buy', 'test_drive', 'callback', 'reserve'], default: 'buy' },
    message: { type: String, default: '' },
    phone: { type: String, default: '' },
    bookingDate: { type: String, default: '' },
    bookingTime: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled', 'in_transit', 'shipped', 'delivered'], default: 'pending' },
    basePrice: { type: Number, required: true, default: 0 },
    taxAmount: { type: Number, default: 0 },
    commissionAmount: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true, default: 0 },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    paymentMethod: { type: String, enum: ['card', 'transfer', 'cash', 'mobile_money', 'telebirr', 'cbe_birr', 'chapa'], default: 'card' },
    paymentPhone: { type: String },
    paymentProvider: { type: String },
    negotiationStatus: { type: String, enum: ['none', 'active', 'accepted', 'rejected'], default: 'none' },
    negotiatedPrice: { type: Number },
    transactionId: { type: String },
    tx_ref: { type: String, unique: true, sparse: true },
    invoiceId: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
