const express = require('express');
const router = express.Router();
const {
    createTicket,
    getTickets,
    getTicketById,
    addReply,
    updateTicketStatus
} = require('../controllers/ticketController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
    .get(protect, getTickets)
    .post(protect, upload.array('attachments', 5), createTicket);

router.route('/:id')
    .get(protect, getTicketById);

router.post('/:id/reply', protect, upload.array('attachments', 5), addReply);

router.put('/:id/status', protect, adminOnly, updateTicketStatus);

module.exports = router;
