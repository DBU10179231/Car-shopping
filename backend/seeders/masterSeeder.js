const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Car = require('../models/Car');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

const users = [
    { name: 'Super Admin', email: 'tebelmaryam437@gmail.com', password: 'Admin@123', role: 'super_admin' },
    { name: 'John Dealer', email: 'dealer@carshop.com', password: 'Admin@123', role: 'dealer', shopName: 'Johns Auto' },
    { name: 'Alice Buyer', email: 'buyer@carshop.com', password: 'Admin@123', role: 'user' },
    { name: 'Bob Support', email: 'support@carshop.com', password: 'Admin@123', role: 'support' },
    { name: 'Charlie Finance', email: 'finance@carshop.com', password: 'Admin@123', role: 'finance' }
];

const cars = [
    { make: 'Toyota', model: 'Camry', year: 2022, price: 25000, mileage: 15000, fuelType: 'Gasoline', transmission: 'Automatic', category: 'Sedan', color: 'Silver', status: 'active', description: 'Reliable sedan.', images: ['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800'] },
    { make: 'BMW', model: 'X5', year: 2023, price: 65000, mileage: 5000, fuelType: 'Gasoline', transmission: 'Automatic', category: 'SUV', color: 'Black', status: 'active', description: 'Luxury SUV.', images: ['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800'] },
    { make: 'Tesla', model: 'Model 3', year: 2023, price: 45000, mileage: 8000, fuelType: 'Electric', transmission: 'Automatic', category: 'Electric', color: 'White', status: 'active', description: 'Electric sedan.', images: ['https://images.unsplash.com/photo-1561580125-028ee3bd62eb?w=800'] },
    { make: 'Ford', model: 'F-150', year: 2022, price: 55000, mileage: 12000, fuelType: 'Gasoline', transmission: 'Automatic', category: 'Truck', color: 'Blue', status: 'active', description: 'Powerful truck.', images: ['https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800'] },
    { make: 'Honda', model: 'Civic', year: 2021, price: 22000, mileage: 25000, fuelType: 'Gasoline', transmission: 'Automatic', category: 'Sedan', color: 'Red', status: 'active', description: 'Popular compact.', images: ['https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800'] },
    { make: 'Mercedes', model: 'S-Class', year: 2023, price: 110000, mileage: 1000, fuelType: 'Gasoline', transmission: 'Automatic', category: 'Sedan', color: 'Black', status: 'active', description: 'Flagship luxury.', images: ['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800'] },
    { make: 'Porsche', model: '911', year: 2022, price: 125000, mileage: 3000, fuelType: 'Gasoline', transmission: 'Automatic', category: 'Coupe', color: 'White', status: 'active', description: 'Sports car icon.', images: ['https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800'] },
    { make: 'Jeep', model: 'Wrangler', year: 2021, price: 45000, mileage: 20000, fuelType: 'Gasoline', transmission: 'Automatic', category: 'SUV', color: 'Yellow', status: 'active', description: 'Off-road beast.', images: ['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800'] },
    { make: 'Hyundai', model: 'Ioniq 5', year: 2023, price: 52000, mileage: 4000, fuelType: 'Electric', transmission: 'Automatic', category: 'Electric', color: 'Gray', status: 'active', description: 'Futuristic EV.', images: ['https://images.unsplash.com/photo-1661347333273-392e59159229?w=800'] },
    { make: 'NIO', model: 'ET7', year: 2024, price: 70000, mileage: 500, fuelType: 'Electric', transmission: 'Automatic', category: 'Electric', color: 'Silver', status: 'pending', description: 'Premium EV sedan.', images: ['https://images.unsplash.com/photo-1617788138017-80ad42243c7d?w=800'] }
];

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Clear existing data
        await User.deleteMany();
        await Car.deleteMany();
        await Order.deleteMany();
        await Notification.deleteMany();
        await AuditLog.deleteMany();
        console.log('Cleared existing data');

        // Create Users
        const createdUsers = [];
        for (const u of users) {
            const user = await User.create(u);
            createdUsers.push(user);
        }
        console.log(`Created ${createdUsers.length} users`);

        const admin = createdUsers.find(u => u.role === 'super_admin');
        const dealer = createdUsers.find(u => u.role === 'dealer');
        const buyer = createdUsers.find(u => u.role === 'user');

        // Create Cars
        const seededCars = [];
        for (let i = 0; i < cars.length; i++) {
            const carData = {
                ...cars[i],
                seller: i % 2 === 0 ? admin._id : dealer._id
            };
            const car = await Car.create(carData);
            seededCars.push(car);
        }
        console.log(`Created ${seededCars.length} cars`);

        // Create Orders
        const orderStatuses = ['pending', 'approved', 'completed', 'cancelled', 'delivered'];
        const paymentStatuses = ['pending', 'paid', 'failed'];
        const paymentMethods = ['card', 'transfer', 'cash', 'mobile_money'];

        for (let i = 0; i < 25; i++) {
            const car = seededCars[i % seededCars.length];
            const orderStatus = orderStatuses[i % orderStatuses.length];
            const paymentStatus = i % 2 === 0 ? 'paid' : 'pending';
            const paymentMethod = paymentMethods[i % paymentMethods.length];

            await Order.create({
                user: buyer._id,
                car: car._id,
                basePrice: car.price,
                totalPrice: car.price + 500,
                status: orderStatus,
                paymentStatus: paymentStatus,
                paymentMethod: paymentMethod,
                type: 'buy'
            });
        }
        console.log('Created 25 orders');

        // Create Audit Logs
        await AuditLog.create({
            adminId: admin._id,
            action: 'SEED_DATA',
            targetType: 'settings',
            details: 'Master seed data populated successfully'
        });

        console.log('✅ Database seeded successfully!');
        process.exit();
    } catch (err) {
        console.error('Error seeding database:', err);
        process.exit(1);
    }
};

seed();
