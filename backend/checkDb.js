const mongoose = require('mongoose');
const Car = require('c:\\Users\\Lab\\Desktop\\car shopping system\\backend\\models\\Car');

mongoose.connect('mongodb://localhost:27017/carshoppingdb')
    .then(async () => {
        const idToCheck = '69ac7a11eea3c6bb8dc7b6cb';
        console.log(`Checking Car with ID: ${idToCheck}`);
        
        try {
            const car = await Car.findById(idToCheck);
            console.log('Result for ID search:', car);
        } catch(e) { console.log('Error by ID:', e.message); }

        const allCars = await Car.find().select('_id make model status available');
        console.log('\nList of all cars in DB (ID, Make, Model, Status, Available):');
        allCars.forEach(c => {
            console.log(c._id, c.make, c.model, c.status, c.available);
        });

        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
