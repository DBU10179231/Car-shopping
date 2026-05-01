const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const check = async () => {
    try {
        console.log('Connecting to:', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 2000
        });
        console.log('Connected to DB');
        const admin = await User.findOne({ username: 'Admin' });
        if (admin) {
            console.log('Admin user found:');
            console.log('Username:', admin.username);
            console.log('Email:', admin.email);
            console.log('Role:', admin.role);
            console.log('Password Hash exists:', !!admin.password);
        } else {
            console.log('Admin user NOT found');
            const allUsers = await User.find().select('username email role');
            console.log('All users in DB:', allUsers);
        }
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
};

check();
