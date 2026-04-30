const axios = require('axios');

/**
 * Payment Service — Chapa Gateway Integration
 * Full implementation per official Chapa API v1 documentation.
 * Endpoints: Initialize, Verify, Cancel, Transfers, Banks, Balance,
 *            Transaction Logs, All Transactions, Receipt URL
 */

const CHAPA_BASE = 'https://api.chapa.co/v1';

const chapaHeaders = () => ({
    Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
    'Content-Type': 'application/json'
});

const isChapaTest = () => {
    const key = process.env.CHAPA_SECRET_KEY || '';
    return !key || key.includes('xxxxxx') || key === 'CHAPA_SECRET_KEY';
};

// ─── Mock Mode ────────────────────────────────────────────────────────────────
const mockCheckoutUrl = (tx_ref, return_url) =>
    `${return_url || 'http://localhost:5173/payment/verify'}?mock=true&tx_ref=${tx_ref}`;

// ─── 1. Initialize / Accept Payment ──────────────────────────────────────────
/**
 * POST https://api.chapa.co/v1/transaction/initialize
 * Required: amount, currency, email, first_name, last_name, tx_ref, callback_url, return_url
 */
const initializePayment = async (paymentData) => {
    const {
        amount, currency = 'ETB',
        email, first_name, last_name, phone_number,
        tx_ref, callback_url, return_url,
        customization_title = 'AutoMarket',
        customization_description = 'Vehicle purchase via AutoMarket',
        provider = 'chapa'
    } = paymentData;

    if (isChapaTest()) {
        console.log(`🛡️  [MOCK CHAPA] Init transaction: ${tx_ref}`);
        return {
            status: 'success',
            data: {
                checkout_url: mockCheckoutUrl(tx_ref, return_url),
                tx_ref
            }
        };
    }

    try {
        const payload = {
            amount: String(amount),
            currency,
            email,
            first_name,
            last_name,
            phone_number: phone_number || '',
            tx_ref,
            callback_url,
            return_url,
            customization: {
                title: customization_title,
                description: customization_description
            },
            meta: {
                hide_receipt: false,
                custom_receipt_enabled: true
            }
        };

        const response = await axios.post(
            `${CHAPA_BASE}/transaction/initialize`,
            payload,
            { headers: chapaHeaders() }
        );

        return {
            status: 'success',
            data: {
                checkout_url: response.data?.data?.checkout_url,
                tx_ref
            }
        };
    } catch (error) {
        let msg = error.response?.data?.message || error.message;
        if (typeof msg === 'object') msg = JSON.stringify(msg);
        console.error('❌ Chapa Init Error:', msg);
        throw new Error(`Chapa payment initialization failed: ${msg}`);
    }
};

// ─── 2. Verify Payment ────────────────────────────────────────────────────────
/**
 * GET https://api.chapa.co/v1/transaction/verify/{tx_ref}
 */
const verifyPayment = async (tx_ref) => {
    if (isChapaTest()) {
        return { status: 'success', message: '[MOCK] Payment verified', data: { tx_ref } };
    }

    try {
        const response = await axios.get(
            `${CHAPA_BASE}/transaction/verify/${tx_ref}`,
            { headers: chapaHeaders() }
        );
        return response.data;
    } catch (error) {
        const msg = error.response?.data?.message || error.message;
        console.error('❌ Chapa Verify Error:', msg);
        throw new Error(`Payment verification failed: ${msg}`);
    }
};

// ─── 3. Cancel Transaction ────────────────────────────────────────────────────
/**
 * PUT https://api.chapa.co/v1/transaction/cancel/{tx_ref}
 */
const cancelTransaction = async (tx_ref) => {
    if (isChapaTest()) {
        return { status: 'success', message: '[MOCK] Transaction cancelled', data: { tx_ref } };
    }

    try {
        const response = await axios.put(
            `${CHAPA_BASE}/transaction/cancel/${tx_ref}`,
            {},
            { headers: chapaHeaders() }
        );
        return response.data;
    } catch (error) {
        const msg = error.response?.data?.message || error.message;
        console.error('❌ Chapa Cancel Error:', msg);
        throw new Error(`Transaction cancellation failed: ${msg}`);
    }
};

// ─── 4. Get All Transactions ───────────────────────────────────────────────────
/**
 * GET https://api.chapa.co/v1/transactions
 */
const getAllTransactions = async () => {
    if (isChapaTest()) {
        return { status: 'success', message: '[MOCK] Transactions list', data: [] };
    }

    try {
        const response = await axios.get(
            `${CHAPA_BASE}/transactions`,
            { headers: chapaHeaders() }
        );
        return response.data;
    } catch (error) {
        const msg = error.response?.data?.message || error.message;
        console.error('❌ Chapa Transactions Error:', msg);
        throw new Error(`Failed to fetch transactions: ${msg}`);
    }
};

// ─── 5. Transaction Logs / Events ─────────────────────────────────────────────
/**
 * GET https://api.chapa.co/v1/transaction/events/{tx_ref}
 */
const getTransactionLogs = async (tx_ref) => {
    if (isChapaTest()) {
        return { status: 'success', message: '[MOCK] Transaction logs', data: { tx_ref, events: [] } };
    }

    try {
        const response = await axios.get(
            `${CHAPA_BASE}/transaction/events/${tx_ref}`,
            { headers: chapaHeaders() }
        );
        return response.data;
    } catch (error) {
        const msg = error.response?.data?.message || error.message;
        console.error('❌ Chapa Transaction Logs Error:', msg);
        throw new Error(`Failed to fetch transaction logs: ${msg}`);
    }
};

// ─── 6. Transfer (Payout) ─────────────────────────────────────────────────────
/**
 * POST https://api.chapa.co/v1/transfers
 */
const createTransfer = async ({ account_name, account_number, amount, currency = 'ETB', reference, bank_code }) => {
    if (isChapaTest()) {
        return { status: 'success', message: '[MOCK] Transfer initiated', data: { reference } };
    }

    try {
        const response = await axios.post(
            `${CHAPA_BASE}/transfers`,
            { account_name, account_number, amount: String(amount), currency, reference, bank_code },
            { headers: chapaHeaders() }
        );
        return response.data;
    } catch (error) {
        const msg = error.response?.data?.message || error.message;
        console.error('❌ Chapa Transfer Error:', msg);
        throw new Error(`Transfer failed: ${msg}`);
    }
};

// ─── 7. Verify Transfer ────────────────────────────────────────────────────────
/**
 * GET https://api.chapa.co/v1/transfers/verify/{reference}
 */
const verifyTransfer = async (reference) => {
    if (isChapaTest()) {
        return { status: 'success', message: '[MOCK] Transfer verified', data: { reference } };
    }

    try {
        const response = await axios.get(
            `${CHAPA_BASE}/transfers/verify/${reference}`,
            { headers: chapaHeaders() }
        );
        return response.data;
    } catch (error) {
        const msg = error.response?.data?.message || error.message;
        console.error('❌ Chapa Transfer Verify Error:', msg);
        throw new Error(`Transfer verification failed: ${msg}`);
    }
};

// ─── 8. List of Banks ──────────────────────────────────────────────────────────
/**
 * GET https://api.chapa.co/v1/banks
 */
const getBanks = async () => {
    if (isChapaTest()) {
        return {
            status: 'success',
            data: [
                { id: 1, swift: 'CBETETAA', name: 'Commercial Bank of Ethiopia' },
                { id: 2, swift: 'ABYSETAA', name: 'Abyssinia Bank' },
                { id: 3, swift: 'DASHETAA', name: 'Dashen Bank' },
                { id: 4, swift: 'AWABETAA', name: 'Awash Bank' }
            ]
        };
    }

    try {
        const response = await axios.get(
            `${CHAPA_BASE}/banks`,
            { headers: chapaHeaders() }
        );
        return response.data;
    } catch (error) {
        const msg = error.response?.data?.message || error.message;
        console.error('❌ Chapa Banks Error:', msg);
        throw new Error(`Failed to fetch banks: ${msg}`);
    }
};

// ─── 9. Get Account Balance ────────────────────────────────────────────────────
/**
 * GET https://api.chapa.co/v1/balances
 */
const getBalance = async () => {
    if (isChapaTest()) {
        return {
            status: 'success',
            data: {
                balance: 250000000,
                currency: 'ETB'
            }
        };
    }

    try {
        const response = await axios.get(
            `${CHAPA_BASE}/balances`,
            { headers: chapaHeaders() }
        );
        return response.data;
    } catch (error) {
        const msg = error.response?.data?.message || error.message;
        console.error('❌ Chapa Balance Error:', msg);
        throw new Error(`Failed to fetch balance: ${msg}`);
    }
};

// ─── 10. Payment Receipt URL ───────────────────────────────────────────────────
/**
 * After successful payment, redirect user to Chapa receipt page.
 * URL format: https://chapa.link/payment-receipt/{chapa_reference_id}
 */
const getReceiptUrl = (chapaReferenceId) => {
    return `https://chapa.link/payment-receipt/${chapaReferenceId}`;
};

// ─── 11. Validate / Authorize Payment (e.g., Amole) ──────────────────────────
/**
 * POST https://api.chapa.co/v1/validate?type=amole
 */
const validatePayment = async (type, reference, clientData) => {
    if (isChapaTest()) {
        return { status: 'success', message: '[MOCK] Payment authorized', data: {} };
    }

    try {
        const payload = { reference, client: clientData };
        const response = await axios.post(
            `${CHAPA_BASE}/validate?type=${type}`,
            payload,
            { headers: chapaHeaders() }
        );
        return response.data;
    } catch (error) {
        const msg = error.response?.data?.message || error.message;
        console.error(`❌ Chapa Validate Error (${type}):`, msg);
        throw new Error(`Payment validation failed: ${msg}`);
    }
};

module.exports = {
    initializePayment,
    verifyPayment,
    cancelTransaction,
    getAllTransactions,
    getTransactionLogs,
    createTransfer,
    verifyTransfer,
    getBanks,
    getBalance,
    getReceiptUrl,
    validatePayment
};
