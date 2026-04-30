const FinanceApplication = require('../models/FinanceApplication');
const Notification = require('../models/Notification');
const { sendEmail, notifyFinanceStatus } = require('../utils/emailService');

// @desc    Submit a financing application
// @route   POST /api/finance/apply
const applyForFinancing = async (req, res) => {
    try {
        const { carId, personalInfo, employmentInfo, financialInfo, provider } = req.body;
        const user = req.user;

        // Create the application
        const application = await FinanceApplication.create({
            user: user._id,
            car: carId,
            provider: provider || 'AutoMarket Direct',
            personalInfo,
            employmentInfo,
            financialInfo,
            status: 'submitted',
            providerReferenceId: `EXT-${Date.now()}`, // Mock external API ID
            history: [{ status: 'submitted', comment: 'Application received and initially validated.' }]
        });

        // Notify User
        await Notification.create({
            user: user._id,
            title: 'Financing Application Received',
            text: `Your application to ${application.provider} has been submitted successfully and is under review.`,
            type: 'financing'
        });

        // Mock Send Email to User
        if (user.email) {
            await sendEmail({
                email: user.email,
                subject: 'Financing Application Received',
                message: `<h2>Application Received</h2><p>We've received your financing application for ${provider || 'AutoMarket Direct'}. We will notify you once a decision is made.</p>`
            });
        }

        res.status(201).json({ message: 'Application submitted successfully', application });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get user's financing applications
// @route   GET /api/finance/my-applications
const getMyApplications = async (req, res) => {
    try {
        const applications = await FinanceApplication.find({ user: req.user._id })
            .populate('car', 'make model year price images')
            .sort({ createdAt: -1 });
        res.json(applications);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Update application status (Admin/Webhook Mock)
// @route   PUT /api/finance/:id/status
const updateApplicationStatus = async (req, res) => {
    try {
        const { status, comment } = req.body;
        const application = await FinanceApplication.findById(req.params.id).populate('user');

        if (!application) return res.status(404).json({ message: 'Application not found' });

        application.status = status;
        application.history.push({ status, comment: comment || `Status updated to ${status}` });
        await application.save();

        // Notify User via in-app notification
        await Notification.create({
            user: application.user._id,
            title: 'Financing Status Update',
            text: `Your financing application status has been updated to: ${status}`,
            type: 'financing'
        });

        // Notify User via Email using specialized template
        if (application.user.email) {
            await notifyFinanceStatus(application.user.email, application.provider, status, comment);
        }

        res.json({ message: 'Status updated', application });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Simulate sync with external bank API
// @route   POST /api/finance/:id/sync
const syncWithPartnerAPI = async (req, res) => {
    try {
        const application = await FinanceApplication.findById(req.params.id).populate('user');
        if (!application) return res.status(404).json({ message: 'Application not found' });

        // Simulate external API call delay
        console.log(`[FinanceSync] 🔄 Syncing with ${application.provider} for Ref: ${application.providerReferenceId}...`);

        // Mocked logic: 70% chance of random status change if still submitted/under_review
        const statuses = ['under_review', 'approved', 'rejected'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

        if (application.status === 'submitted' || application.status === 'under_review') {
            application.status = randomStatus;
            application.history.push({
                status: randomStatus,
                comment: `Automated sync with ${application.provider} API.`
            });
            await application.save();

            // Notify User
            if (application.user.email) {
                await notifyFinanceStatus(application.user.email, application.provider, randomStatus, 'Status updated via automated partner sync.');
            }
        }

        res.json({ message: 'Sync completed', currentStatus: application.status });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get all financing applications (Admin)
// @route   GET /api/finance/admin/all
const getAllApplications = async (req, res) => {
    try {
        const applications = await FinanceApplication.find({})
            .populate('user', 'name email')
            .populate('car', 'make model year price images')
            .sort({ createdAt: -1 });
        res.json(applications);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    applyForFinancing,
    getMyApplications,
    updateApplicationStatus,
    syncWithPartnerAPI,
    getAllApplications
};
