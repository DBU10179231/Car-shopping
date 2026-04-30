const axios = require('axios');

async function checkChapa() {
    const CHAPA_SECRET_KEY = 'CHASECK_TEST-2SUccROGCd2uJELCQvI0RB5OFsoGe4CK';
    const tx_ref = 'tx-1772957580045-664275';

    try {
        console.log(`🔍 Checking Chapa for tx_ref: ${tx_ref}`);
        const response = await axios.get(
            `https://api.chapa.co/v1/transaction/verify/${tx_ref}`,
            {
                headers: {
                    Authorization: `Bearer ${CHAPA_SECRET_KEY}`
                }
            }
        );
        console.log('--- RAW CHAPA RESPONSE ---');
        console.log(JSON.stringify(response.data, null, 2));
        process.exit(0);
    } catch (err) {
        if (err.response) {
            console.error('❌ Chapa Error Response:', err.response.data);
        } else {
            console.error('❌ Error:', err.message);
        }
        process.exit(1);
    }
}

checkChapa();
