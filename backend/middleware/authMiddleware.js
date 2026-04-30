const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            // Get user from token
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'User no longer exists' });
            }

            if (req.user.status === 'banned') {
                return res.status(403).json({ message: 'Your account has been banned' });
            }

            // Check if the token version matches the user's current token version
            // If it doesn't match, it means the user's sessions were revoked.
            if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== req.user.tokenVersion) {
                return res.status(401).json({ message: 'Session expired. Please log in again.' });
            }

            next();
        } catch (error) {
            return res.status(401).json({ message: 'Not authorized, invalid token' });
        }
    } else {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const adminOnly = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin')) {
        next();
    } else {
        res.status(403).json({ message: 'Admin access only' });
    }
};

const sellerOnly = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin' || req.user.role === 'dealer')) {
        next();
    } else {
        res.status(403).json({ message: 'Sellers/Admins access only' });
    }
};

const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ message: 'Not authorized' });

        // Super admins have all permissions
        if (req.user.role === 'super_admin') return next();

        // Check if the user's permissions array includes the required permission
        if (req.user.permissions && req.user.permissions.includes(permission)) {
            return next();
        }

        res.status(403).json({ message: `Access denied. Requires permission: ${permission}` });
    };
};

module.exports = { protect, adminOnly, sellerOnly, requirePermission };
