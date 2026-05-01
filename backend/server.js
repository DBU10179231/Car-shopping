console.log('LOADING SERVER.JS');
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const path = require('path');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.get('/api/test', (req, res) => res.json({ message: 'API is reachable' }));
app.get('/api/tickets/count', async (req, res) => {
    try {
        const Ticket = require('./models/Ticket');
        const count = await Ticket.countDocuments();
        res.json({ count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.use('/api/tickets', require('./routes/ticketRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/cars', require('./routes/carRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/seller', require('./routes/sellerRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/finance', require('./routes/financeRoutes'));
app.use('/api/logistics', require('./routes/logisticsRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/uploads', require('./routes/uploadRoutes'));

// Health check
app.get('/', (req, res) => res.json({ message: 'Car Shopping API running ✅' }));
console.log('✅ Ticket routes initialized');

// 404 Debugger
app.use((req, res, next) => {
    console.log(`[404 DEBUG] Unmatched request: ${req.method} ${req.originalUrl}`);
    next();
});

app.use(errorHandler);

const startServer = async () => {
    try {
        // Connect to Database
        await connectDB();

        const PORT = process.env.PORT || 5000;
        console.log(`[DEBUG] Attempting to bind to port ${PORT}...`);
        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
        });

        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`\n❌ Port ${PORT} is already in use!`);
                console.error(`   Run this to free it: npx kill-port ${PORT}`);
                console.error(`   Or in PowerShell:    Get-NetTCPConnection -LocalPort ${PORT} | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }\n`);
                process.exit(1);
            } else {
                throw err;
            }
        });
    } catch (error) {
        console.error(`❌ Server startup failed: ${error.message}`);
        process.exit(1);
    }
};

startServer();

