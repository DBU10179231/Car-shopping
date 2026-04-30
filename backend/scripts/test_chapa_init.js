const axios = require('axios');

async function testInit() {
    const CHAPA_SECRET_KEY = 'CHASECK_TEST-2SUccROGCd2uJELCQvI0RB5OFsoGe4CK';
    const tx_ref = 'tx-test-' + Date.now();

    const payload = {
        amount: "100",
        currency: "ETB",
        email: "test.customer@gmail.com",
        first_name: "Test",
        last_name: "User",
        tx_ref: tx_ref,
        callback_url: "https://example.com/callback",
        return_url: "https://example.com/return",
        customization: {
            title: "Test Purchase",
            description: "Testing Receipt"
        },
        meta: {
            hide_receipt: false
        }
    };

    try {
        console.log('🚀 Initializing new transaction...');
        const response = await axios.post(
            'https://api.chapa.co/v1/transaction/initialize',
            payload,
            {
                headers: {
                    Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('--- INITIALIZE RESPONSE ---');
        console.log(JSON.stringify(response.data, null, 2));
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.response?.data || err.message);
        process.exit(1);
    }
}

testInit();
