const axios = require('axios');

async function listTransactions() {
    const CHAPA_SECRET_KEY = 'CHASECK_TEST-2SUccROGCd2uJELCQvI0RB5OFsoGe4CK';

    try {
        console.log('🔍 Listing Chapa Transactions...');
        const response = await axios.get(
            `https://api.chapa.co/v1/transactions`,
            {
                headers: {
                    Authorization: `Bearer ${CHAPA_SECRET_KEY}`
                }
            }
        );
        console.log('--- CHAPA TRANSACTIONS ---');
        console.log('Keys:', Object.keys(response.data));
        const txs = response.data.data?.transactions || response.data.data || [];
        console.log('Sample Transaction:', JSON.stringify(txs[0], null, 2));
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.response?.data || err.message);
        process.exit(1);
    }
}

listTransactions();
