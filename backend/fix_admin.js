const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const fixAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // Update the user to ensure correct role and username
        const result = await User.updateOne(
            { email: 'tebelmaryam437@gmail.com' },
            { $set: { role: 'super_admin', username: 'Admin' } }
        );
        console.log('Update result:', result);

        // Also check if the password needs resetting to Admin@123
        const admin = await User.findOne({ email: 'tebelmaryam437@gmail.com' });
        if (admin) {
            admin.password = 'Admin@123';
            await admin.save();
            console.log('Password reset to Admin@123');
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

fixAdmin();
