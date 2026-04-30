const express = require('express');
const router = express.Router();
const {
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
    authorizePayment
} = require('../controllers/paymentController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// ── Core Payment Flow ─────────────────────────────────────────────────────────
router.post('/checkout', protect, checkout);
router.post('/webhook', webhook);                          // Chapa callback (no auth)
router.get('/verify/:tx_ref', protect, verifyPayment);    // Verify after redirect
router.post('/authorize', protect, authorizePayment);     // Authorize (e.g., Amole)
router.put('/cancel/:tx_ref', protect, cancel);           // Cancel pending transaction

// ── Transaction Info ──────────────────────────────────────────────────────────
router.get('/transactions', protect, adminOnly, listTransactions);    // All transactions (admin)
router.get('/logs/:tx_ref', protect, transactionLogs);               // Event logs for a transaction
router.get('/receipt/:reference', protect, receipt);                 // Get Chapa receipt URL

// ── Transfers (Payouts) ────────────────────────────────────────────────────────
router.post('/transfer', protect, adminOnly, transfer);                      // Initiate transfer
router.get('/transfer/verify/:reference', protect, verifyTransferController); // Verify transfer

// ── Utilities ─────────────────────────────────────────────────────────────────
router.get('/banks', protect, listBanks);     // List available banks
router.get('/balance', protect, balance);     // Chapa account balance (admin)

// ── Legacy (mobile simulation) ─────────────────────────────────────────────────
router.post('/simulate-mobile-confirm', protect, simulateMobileConfirm);

module.exports = router;
