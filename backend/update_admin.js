const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');

dotenv.config({ path: path.join(__dirname, '.env') });

const updateAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');
        
        const result = await User.updateOne(
            { email: 'tebelmaryam437@gmail.com' },
            { $set: { username: 'Admin' } }
        );
        
        console.log('Update result:', result);
        console.log('Admin username successfully set to "Admin".');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

updateAdmin();
