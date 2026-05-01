const mongoose = require('mongoose');
const User = require('./models/User');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const testLive = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const admin = await User.findOne({ role: 'super_admin' });
        if (!admin) throw new Error('No admin found');

        const token = jwt.sign({ id: admin._id, role: admin.role, tokenVersion: admin.tokenVersion }, process.env.JWT_SECRET, { expiresIn: '1d' });
        console.log('Generated Token');

        try {
            const res = await axios.get('http://localhost:5008/api/orders', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Live Server Success! Status:', res.status);
            console.log('Data length:', Array.isArray(res.data) ? res.data.length : 'not an array');
        } catch (err) {
            console.error('Live Server Error! Status:', err.response?.status);
            console.error('Error Data:', err.response?.data);
        }

        process.exit(0);
    } catch (err) {
        console.error('Test Error:', err.message);
        process.exit(1);
    }
};

testLive();
