const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const Car = require('../models/Car');
const User = require('../models/User');

const seedCars = [
    { _id: '69b2dc035f5127495cb142e0', make: 'Toyota', model: 'Camry', year: 2022, price: 25000, mileage: 15000, fuelType: 'Gasoline', transmission: 'Automatic', category: 'Sedan', color: 'Silver', status: 'active', description: 'Reliable and fuel-efficient midsize sedan with a comfortable interior.', images: ['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800'], features: ['Bluetooth', 'Backup Camera', 'Apple CarPlay', 'Lane Assist'] },
    { _id: '69b2dc035f5127495cb142e1', make: 'BMW', model: 'X5', year: 2023, price: 65000, mileage: 5000, fuelType: 'Gasoline', transmission: 'Automatic', category: 'SUV', color: 'Black', status: 'active', description: 'Luxury SUV with powerful engine and premium interior.', images: ['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800'], features: ['Panoramic Roof', 'Heated Seats', 'Harman Kardon Audio', 'Adaptive Cruise'] },
    { _id: '69b2dc035f5127495cb142e2', make: 'Ford', model: 'Mustang', year: 2021, price: 42000, mileage: 22000, fuelType: 'Gasoline', transmission: 'Manual', category: 'Coupe', color: 'Red', status: 'active', description: 'Iconic American muscle car with V8 engine and sport exhaust.', images: ['https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800'], features: ['V8 Engine', 'Sport Exhaust', 'Launch Control', 'Track Mode'] },
    { _id: '69b2dc035f5127495cb142e3', make: 'Tesla', model: 'Model 3', year: 2023, price: 45000, mileage: 8000, fuelType: 'Electric', transmission: 'Automatic', category: 'Electric', color: 'White', status: 'active', description: 'All-electric sedan with Autopilot and over-the-air updates.', images: ['https://images.unsplash.com/photo-1561580125-028ee3bd62eb?w=800'], features: ['Autopilot', 'Full Self-Driving Ready', '358 mi Range', 'Supercharger Access'] },
    { _id: '69b2dc035f5127495cb142e4', make: 'Honda', model: 'CR-V', year: 2022, price: 30000, mileage: 18000, fuelType: 'Hybrid', transmission: 'Automatic', category: 'SUV', color: 'Blue', status: 'active', description: 'Versatile hybrid SUV with ample cargo space and excellent fuel economy.', images: ['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800'], features: ['Honda Sensing', 'Wireless CarPlay', 'Hybrid Engine', 'LED Headlights'] },
    { _id: '69b2dc035f5127495cb142e5', make: 'Mercedes', model: 'C-Class', year: 2023, price: 55000, mileage: 3000, fuelType: 'Gasoline', transmission: 'Automatic', category: 'Sedan', color: 'Gray', status: 'active', description: 'Elegant luxury sedan with cutting-edge tech and refined ride quality.', images: ['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800'], features: ['MBUX Infotainment', 'Air Suspension', '360 Camera', 'Massage Seats'] },
    { _id: '69b2dc035f5127495cb142e6', make: 'Toyota', model: 'Hilux', year: 2021, price: 35000, mileage: 40000, fuelType: 'Diesel', transmission: 'Manual', category: 'Truck', color: 'White', status: 'active', description: 'Tough and dependable pickup truck built for any terrain.', images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'], features: ['4x4 Drive', 'Towing Package', 'Bull Bar', 'Bed Liner'] },
    { _id: '69b2dc035f5127495cb142e7', make: 'Audi', model: 'Q7', year: 2022, price: 72000, mileage: 12000, fuelType: 'Diesel', transmission: 'Automatic', category: 'SUV', color: 'White', status: 'active', description: '3-row luxury SUV with quattro all-wheel drive and premium sound system.', images: ['https://images.unsplash.com/photo-1542362567-b07e54358753?w=800'], features: ['Quattro AWD', 'Bang & Olufsen Audio', '7 Seats', 'Virtual Cockpit'] },
    { _id: '69b2dc035f5127495cb142e8', make: 'Kia', model: 'EV6', year: 2023, price: 48000, mileage: 6000, fuelType: 'Electric', transmission: 'Automatic', category: 'Electric', color: 'Green', status: 'active', description: 'Award-winning electric crossover with 310-mile range and 800V charging.', images: ['https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800'], features: ['800V Fast Charging', 'Head-Up Display', 'Meridian Audio', 'ADAS Suite'] },
    { _id: '69b2dc035f5127495cb142e9', make: 'Honda', model: 'Odyssey', year: 2022, price: 38000, mileage: 25000, fuelType: 'Gasoline', transmission: 'Automatic', category: 'Van', color: 'White', status: 'active', description: 'Ultimate family minivan with spacious seating and advanced safety features.', images: ['https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800'], features: ['Magic Slide Seats', 'Rear Entertainment', 'Honda Sensing', 'CabinWatch'] },
    { _id: '69b2dc035f5127495cb142ea', make: 'Mazda', model: 'MX-5', year: 2023, price: 32000, mileage: 4000, fuelType: 'Gasoline', transmission: 'Manual', category: 'Convertible', color: 'Soul Red', status: 'active', description: 'Lightweight roadster with perfect balance and open-top driving fun.', images: ['https://images.unsplash.com/photo-1552639614-2460967e023c?w=800'], features: ['Bose Audio', 'Apple CarPlay', 'Limited Slip Diff', 'Sport Suspension'] },
    { _id: '69b2dc035f5127495cb142ef', make: 'Land Rover', model: 'Defender', year: 2024, price: 85000, mileage: 100, fuelType: 'Gasoline', transmission: 'Automatic', category: 'SUV', color: 'Santorini Black', status: 'active', description: 'Unstoppable off-road capability combined with modern luxury and advanced technology.', images: ['https://images.unsplash.com/photo-1605515298946-d062f2e9da53?w=800'], features: ['Pivi Pro Infotainment', 'ClearSight Ground View', 'Electronic Air Suspension', 'Meridian Sound System'] },
];

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // Create an admin user if not exists
        let admin = await User.findOne({ email: 'tebelmaryam437@gmail.com' });
        if (!admin) {
            admin = await User.create({ name: 'Admin', email: 'tebelmaryam437@gmail.com', password: 'admin123', role: 'admin' });
            console.log('Admin user created: tebelmaryam437@gmail.com / admin123');
        }

        console.log(`Synchronizing ${seedCars.length} cars with stable IDs...`);
        let syncedCount = 0;

        for (const carData of seedCars) {
            await Car.findByIdAndUpdate(
                carData._id,
                { ...carData, seller: admin._id },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            syncedCount++;
        }

        // Clean up any old seed cars (not in our fixed ID list) but belong to admin
        const activeIds = seedCars.map(c => c._id);
        const deleteResult = await Car.deleteMany({ 
            _id: { $nin: activeIds }, 
            seller: admin._id 
        });

        console.log(`✅ Success: ${syncedCount} cars synchronized.`);
        if (deleteResult.deletedCount > 0) {
            console.log(`🧹 Cleaned up ${deleteResult.deletedCount} legacy entries.`);
        }
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seed();
