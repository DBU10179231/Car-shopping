const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const addTestUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const email = 'user@carshop.com';
        const username = 'User';
        const password = 'Admin@123';

        // Check if exists
        let user = await User.findOne({ $or: [{ email }, { username }] });
        
        if (user) {
            user.username = username;
            user.password = password;
            user.role = 'user';
            await user.save();
            console.log('Existing user updated to username "User"');
        } else {
            await User.create({
                name: 'Test User',
                username,
                email,
                password,
                role: 'user'
            });
            console.log('New user "User" created successfully');
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

addTestUser();
