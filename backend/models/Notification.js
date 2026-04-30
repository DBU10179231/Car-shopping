const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['message', 'test_drive', 'system', 'alert', 'financing', 'logistics'],
        default: 'system'
    },
    unread: {
        type: Boolean,
        default: true
    },
    link: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
