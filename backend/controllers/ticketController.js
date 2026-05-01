const Ticket = require('../models/Ticket');
const Notification = require('../models/Notification');

// @desc    Create a new support ticket
// @route   POST /api/tickets
// @access  Private
const createTicket = async (req, res) => {
    try {
        const { subject, category, priority, description } = req.body;
        
        let attachments = [];
        if (req.files) {
            const protocol = req.protocol;
            const host = req.get('host');
            attachments = req.files.map(file => `${protocol}://${host}/${file.path.replace(/\\/g, '/')}`);
        }

        const ticket = await Ticket.create({
            user: req.user._id,
            subject,
            category,
            priority,
            description,
            attachments,
            messages: [{
                sender: req.user._id,
                content: description,
                attachments
            }]
        });

        res.status(201).json(ticket);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get all tickets (Admin) or user's tickets
// @route   GET /api/tickets
// @access  Private
const getTickets = async (req, res) => {
    try {
        let query = {};
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            query.user = req.user._id;
        }

        const tickets = await Ticket.find(query)
            .populate('user', 'name email profilePhoto')
            .sort({ updatedAt: -1 });

        // Calculate unread messages for each ticket
        const ticketsWithUnread = tickets.map(ticket => {
            const unreadCount = ticket.messages.filter(msg => {
                // If admin, count messages from user. If user, count messages from admin.
                if (req.user.role === 'admin' || req.user.role === 'super_admin') {
                    return msg.sender.toString() === ticket.user._id.toString() && !msg.isRead;
                } else {
                    return msg.sender.toString() !== req.user._id.toString() && !msg.isRead;
                }
            }).length;
            return { ...ticket._doc, unreadMessages: unreadCount };
        });
            
        res.json(ticketsWithUnread);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get single ticket
// @route   GET /api/tickets/:id
// @access  Private
const getTicketById = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id)
            .populate('user', 'name email profilePhoto')
            .populate('messages.sender', 'name email profilePhoto role');

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Only owner or admin can view
        if (ticket.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Mark messages as read if recipient views
        let changed = false;
        ticket.messages.forEach(msg => {
            if (msg.sender._id.toString() !== req.user._id.toString() && !msg.isRead) {
                msg.isRead = true;
                changed = true;
            }
        });
        if (changed) await ticket.save();

        res.json(ticket);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Add reply to ticket
// @route   POST /api/tickets/:id/reply
// @access  Private
const addReply = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        const { content } = req.body;
        let attachments = [];
        if (req.files) {
            const protocol = req.protocol;
            const host = req.get('host');
            attachments = req.files.map(file => `${protocol}://${host}/${file.path.replace(/\\/g, '/')}`);
        }

        ticket.messages.push({
            sender: req.user._id,
            content,
            attachments
        });

        // Update status if admin replies
        if (req.user.role === 'admin' || req.user.role === 'super_admin') {
            ticket.status = 'in-progress';
        }

        await ticket.save();

        // Notify user if admin replies
        if (req.user.role === 'admin' || req.user.role === 'super_admin') {
            await Notification.create({
                user: ticket.user,
                title: 'New Reply to Support Ticket',
                message: `An admin has replied to your ticket: "${ticket.subject}"`,
                type: 'info'
            });
        }

        const updatedTicket = await Ticket.findById(req.params.id)
            .populate('messages.sender', 'name email profilePhoto role');

        res.json(updatedTicket);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Update ticket status
// @route   PUT /api/tickets/:id/status
// @access  Private (Admin)
const updateTicketStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const ticket = await Ticket.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        res.json(ticket);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    createTicket,
    getTickets,
    getTicketById,
    addReply,
    updateTicketStatus
};
