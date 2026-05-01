const {
    initializePayment,
    verifyPayment: verifyChapa,
    cancelTransaction,
    getAllTransactions,
    getTransactionLogs,
    createTransfer,
    verifyTransfer,
    getBanks,
    getBalance,
    getReceiptUrl
} = require('../utils/paymentService');
const Order = require('../models/Order');
const Car = require('../models/Car');
const Logistics = require('../models/Logistics');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { notifySellerPickup } = require('../utils/emailService');

/**
 * @desc    Initialize checkout for a car purchase or service
 * @route   POST /api/payments/checkout
 */
const checkout = async (req, res) => {
    try {
        const { orderId, carId, amount, paymentMethod, logisticsData } = req.body;
        const user = req.user;
        let order;
        let carDoc; // Keep a clean reference to the populated car document

        if (orderId) {
            // Existing order — deep-populate car and car.seller to avoid crash in logistics block
            order = await Order.findById(orderId).populate({
                path: 'car',
                populate: { path: 'seller', select: 'name email' }
            });
            if (!order) return res.status(404).json({ message: 'Order not found' });
            if (order.user.toString() !== user._id.toString()) {
                return res.status(403).json({ message: 'Unauthorized to pay for this order' });
            }
            // order.car may be null if car was deleted, or may be an unpopulated ObjectId
            carDoc = order.car && order.car._id ? order.car : null;
        } else {
            if (!carId) return res.status(400).json({ message: 'carId is required when orderId is not provided' });

            carDoc = await Car.findById(carId).populate('seller', 'name email');
            if (!carDoc) {
                console.error('❌ Checkout: Car not found for ID:', carId);
                return res.status(404).json({ message: 'The requested vehicle is no longer available.' });
            }

            const isBookingFee = req.body.isBookingFee === true;
            const basePrice = Number(amount) || Number(carDoc.price) || 0;
            if (basePrice <= 0) {
                return res.status(400).json({ message: 'Invalid payment amount' });
            }

            const taxRate = 0.15;
            const commissionRate = 0.05;
            const taxAmount = Math.round(basePrice * taxRate);
            const commissionAmount = Math.round(basePrice * commissionRate);
            const totalPrice = basePrice + taxAmount;

            const tx_ref = `tx-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

            // Create order using only the carId ObjectId (not the populated doc)
            order = await Order.create({
                user: user._id,
                car: carDoc._id,           // always pass ObjectId
                type: isBookingFee ? 'reserve' : 'buy',
                basePrice,
                taxAmount,
                commissionAmount,
                totalPrice,
                paymentMethod: paymentMethod || 'card',
                paymentPhone: req.body.paymentPhone || '',
                paymentProvider: req.body.paymentProvider || '',
                paymentStatus: 'pending',
                tx_ref,
                status: 'pending',
                message: isBookingFee ? `Reservation deposit for ${carDoc.make} ${carDoc.model}` : ''
            });
            // carDoc is already available; no need to assign to order.car
        }

        // Ensure tx_ref exists (for retrieved orders that somehow lack one)
        if (!order.tx_ref) {
            order.tx_ref = `tx-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
            await order.save();
        }

        // Calculate total including shipping if logistics selected
        let finalAmount = order.totalPrice;
        if (logisticsData && logisticsData.quote) {
            finalAmount += logisticsData.quote;
        }

        // Create Logistics record if requested and doesn't exist
        // Wrapped in its own try/catch so a logistics failure doesn't abort payment
        if (logisticsData && carDoc) {
            try {
                const existingLogistics = await Logistics.findOne({ order: order._id });
                if (!existingLogistics) {
                    const sellerId = carDoc?.seller?._id || carDoc?.seller;
                    if (!sellerId) {
                        console.warn('⚠️ Skipping logistics creation: No seller ID found on car.');
                    } else {
                        await Logistics.create({
                            order: order._id,
                            car: carDoc._id,
                            buyer: user._id,
                            seller: sellerId,
                        trackingNumber: `TRK-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                        pickupDetails: logisticsData.pickupDetails,
                        deliveryDetails: logisticsData.deliveryDetails,
                        shippingQuote: { amount: logisticsData.quote },
                        history: [{ status: 'pending_pickup', comment: 'Delivery booked via checkout. Awaiting payment confirmation.' }]
                    });
                }
            } catch (logErr) {
                console.error('Logistics creation error (non-fatal):', logErr.message);
                // Continue — logistics failure should not block payment
            }
        }

        // Determine payment provider (chapa, telebirr, cbe_birr, transfer)
        const provider = paymentMethod === 'telebirr' ? 'telebirr' :
            paymentMethod === 'cbe_birr' ? 'cbe_birr' :
                paymentMethod === 'transfer' ? 'transfer' : 'chapa';

        // Safe Name Parsing
        const userName = user.name || 'Value Customer';
        const nameParts = userName.split(' ');
        const first_name = nameParts[0] || 'Customer';
        const last_name = nameParts.slice(1).join(' ') || 'User';



        // Initialize External Payment
        // Ensure email is valid for Chapa (they are strict)
        const safeEmail = user.email && user.email.includes('@') ? user.email : 'customer@automarket.com';

        const paymentResponse = await initializePayment({
            amount: finalAmount,
            currency: 'ETB',
            email: safeEmail,
            first_name,
            last_name,
            tx_ref: order.tx_ref,
            callback_url: `${process.env.API_URL || 'http://localhost:5005'}/api/payments/webhook`,
            return_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment/verify?tx_ref=${order.tx_ref}`,
            provider
        });

        const checkoutUrl = paymentResponse.data.checkout_url;

        res.json({
            checkout_url: checkoutUrl,
            instructions: paymentResponse.data.instructions || null,
            tx_ref: order.tx_ref,
            orderId: order._id,
            carMake: carDoc?.make || 'Unknown',
            carModel: carDoc?.model || 'Vehicle',
            merchantName: 'ABC Car Market', // Platform merchant name
            amount: finalAmount
        });
    } catch (err) {
        console.error('❌ Checkout Error:', err.message);
        if (err.response?.data) {
            console.error('Chapa Response Error:', err.response.data);
        }
        res.status(500).json({ message: err.message || 'An unexpected error occurred during checkout.' });
    }
};

/**
 * @desc    Common logic for successful payment
 */
const handleSuccessfulPayment = async (order, transactionId = null) => {
    order.paymentStatus = 'paid';
    order.status = 'approved';
    order.invoiceId = `INV-${order.tx_ref.slice(-6)}`;

    // Preference: save the explicit transactionId if provided and looks like Chapa ID (starts with AP)
    // Don't overwrite if existing transactionId is already a valid Chapa ID
    const isNewRefValid = transactionId && (transactionId.startsWith('AP') || transactionId.length > 20);
    const isCurrentRefInvalid = !order.transactionId || order.transactionId.startsWith('tx-');

    if (isNewRefValid || isCurrentRefInvalid) {
        if (transactionId) {
            console.log(`💾 Saving transactionId: ${transactionId} for Order: ${order.tx_ref}`);
            order.transactionId = transactionId;
        } else if (!order.transactionId || order.transactionId.startsWith('tx-')) {
            // Generate a mock Chapa-like ID if missing (starts with AP-MOCK)
            order.transactionId = `AP-MOCK-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
            console.log(`🛡️ Generated Mock Chapa ID: ${order.transactionId}`);
        }
    }

    await order.save();

    // Notify User
    await Notification.create({
        user: order.user,
        title: 'Payment Successful',
        text: 'Your payment was successful. The seller will contact you shortly.',
        type: 'system'
    });

    // Notify Admins
    try {
        const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } });
        const adminNotifications = admins.map(admin => ({
            user: admin._id,
            title: order.type === 'reserve' ? '⚡ Vehicle Reserved' : '🎉 Vehicle Sold',
            text: order.type === 'reserve'
                ? `A ${order.car.make} ${order.car.model} has been reserved with a deposit.`
                : `A ${order.car.make} ${order.car.model} has been sold for ${order.totalPrice?.toLocaleString()} ETB.`,
            type: 'alert',
            link: `/admin/orders/${order._id}`
        }));
        if (adminNotifications.length > 0) {
            await Notification.insertMany(adminNotifications);
        }
    } catch (adminErr) {
        console.error('Admin notification error:', adminErr.message);
    }

    // Mark car status based on order type
    if (order.type === 'reserve') {
        await Car.findByIdAndUpdate(order.car, { status: 'reserved', available: false });
    } else {
        await Car.findByIdAndUpdate(order.car, { available: false, status: 'sold' });
    }

    // Handle Logistics Notification if exists
    try {
        const logistics = await Logistics.findOne({ order: order._id }).populate('car seller');
        if (logistics) {
            logistics.history.push({ status: 'pending_pickup', comment: 'Payment confirmed. Pickup scheduling in progress.' });
            await logistics.save();

            if (logistics.seller && logistics.seller.email) {
                await notifySellerPickup(
                    logistics.seller.email,
                    logistics.car,
                    logistics.pickupDetails?.scheduledDate,
                    logistics.pickupDetails?.scheduledTime
                );
            }
        }
    } catch (logErr) {
        console.error('Post-payment logistics notification error (non-fatal):', logErr.message);
    }
};

/**
 * @desc    Webhook handler for payment gateway callbacks
 * @route   POST /api/payments/webhook
 */
const webhook = async (req, res) => {
    try {
        const { tx_ref, status } = req.body;
        if (!tx_ref) return res.status(400).json({ message: 'tx_ref is required' });

        const order = await Order.findOne({ tx_ref });
        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (status === 'success') {
            if (order.paymentStatus !== 'paid') {
                // If it's a Chapa webhook, req.body.reference usually contains the Chapa ID (starts with AP)
                const chapaId = req.body.reference || req.body.id || req.body.trx_ref;
                await handleSuccessfulPayment(order, chapaId);
            }
        } else {
            order.paymentStatus = 'failed';
            await order.save();
        }

        res.sendStatus(200);
    } catch (err) {
        console.error('Webhook error:', err);
        res.status(500).json({ message: err.message });
    }
};

/**
 * @desc    Validate/Authorize payment (e.g., Amole)
 * @route   POST /api/payments/authorize
 */
const authorizePayment = async (req, res) => {
    try {
        const { type, reference, client } = req.body;
        if (!type || !reference) {
            return res.status(400).json({ message: 'type and reference are required' });
        }
        const validationObj = await paymentService.validatePayment(type, reference, client);
        res.json(validationObj);
    } catch (err) {
        console.error('Authorize payment error:', err);
        res.status(500).json({ message: err.message });
    }
};

/**
 * @desc    Verify payment manually (called after redirect from gateway)
 * @route   GET /api/payments/verify/:tx_ref
 */
const verifyPayment = async (req, res) => {
    try {
        const { tx_ref } = req.params;
        const verification = await verifyChapa(tx_ref);

        if (verification.status === 'success') {
            const order = await Order.findOne({ tx_ref }).populate('car');
            if (order && order.paymentStatus !== 'paid') {
                // verification.data.reference is the Chapa ID
                const chapaId = verification.data?.reference || verification.data?.id;
                await handleSuccessfulPayment(order, chapaId);
            }
            verification.order = order;
        }

        res.json(verification);
    } catch (err) {
        console.error('Verify payment error:', err);
        res.status(500).json({ message: err.message });
    }
};

/**
 * @desc    Simulate mobile payment confirmation (PIN/OTP)
 * @route   POST /api/payments/simulate-mobile-confirm
 */
const simulateMobileConfirm = async (req, res) => {
    try {
        const { tx_ref, pin } = req.body;
        console.log('Mobile Confirm Body:', req.body);
        if (!tx_ref) {
            console.log('Error: tx_ref is required');
            return res.status(400).json({ message: 'tx_ref is required' });
        }

        // Accept any 4-digit PIN for true realism (Point 1)
        if (!/^\d{4}$/.test(String(pin))) {
            console.log('Error: Invalid PIN format', pin);
            return res.status(400).json({ message: 'Invalid PIN format. Must be 4 digits.' });
        }

        if (String(pin) === '0000') {
            return res.status(400).json({ message: 'Insufficient funds. Transaction declined.' });
        }

        const order = await Order.findOne({ tx_ref }).populate('car');
        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (order.paymentStatus !== 'paid') {
            await handleSuccessfulPayment(order);
        }

        res.json({
            status: 'success',
            message: 'Payment confirmed via mobile money simulation',
            order
        });
    } catch (err) {
        console.error('Mobile simulation error:', err);
        res.status(500).json({ message: err.message });
    }
};

/**
 * @desc    Cancel a pending transaction
 * @route   PUT /api/payments/cancel/:tx_ref
 */
const cancel = async (req, res) => {
    try {
        const { tx_ref } = req.params;
        const result = await cancelTransaction(tx_ref);

        // Update order status
        const order = await Order.findOne({ tx_ref });
        if (order) {
            order.paymentStatus = 'cancelled';
            order.status = 'cancelled';
            await order.save();
        }

        res.json(result);
    } catch (err) {
        console.error('Cancel transaction error:', err);
        res.status(500).json({ message: err.message });
    }
};

/**
 * @desc    Get all Chapa transactions
 * @route   GET /api/payments/transactions
 */
const listTransactions = async (req, res) => {
    try {
        const result = await getAllTransactions();
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/**
 * @desc    Get transaction event logs
 * @route   GET /api/payments/logs/:tx_ref
 */
const transactionLogs = async (req, res) => {
    try {
        const result = await getTransactionLogs(req.params.tx_ref);
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/**
 * @desc    Initiate a bank transfer (payout)
 * @route   POST /api/payments/transfer
 */
const transfer = async (req, res) => {
    try {
        const { account_name, account_number, amount, currency, reference, bank_code } = req.body;
        const result = await createTransfer({ account_name, account_number, amount, currency, reference, bank_code });
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/**
 * @desc    Verify a bank transfer
 * @route   GET /api/payments/transfer/verify/:reference
 */
const verifyTransferController = async (req, res) => {
    try {
        const result = await verifyTransfer(req.params.reference);
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/**
 * @desc    List available banks
 * @route   GET /api/payments/banks
 */
const listBanks = async (req, res) => {
    try {
        const result = await getBanks();
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/**
 * @desc    Get Chapa account balance
 * @route   GET /api/payments/balance
 */
const balance = async (req, res) => {
    try {
        const result = await getBalance();
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/**
 * @desc    Get payment receipt URL after successful payment
 * @route   GET /api/payments/receipt/:reference
 */
const receipt = async (req, res) => {
    try {
        const { reference } = req.params;
        console.log('📄 Receipt requested for reference:', reference);
        if (!reference) return res.status(400).json({ message: 'Chapa reference ID is required' });
        const receiptUrl = getReceiptUrl(reference);
        res.json({ receiptUrl });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    checkout,
    webhook,
    verifyPayment,
    simulateMobileConfirm,
    cancel,
    listTransactions,
    transactionLogs,
    transfer,
    verifyTransferController,
    listBanks,
    balance,
    receipt,
    authorizePayment,
    handleSuccessfulPayment
};
