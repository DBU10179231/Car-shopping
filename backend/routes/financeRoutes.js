const express = require('express');
const router = express.Router();
const { applyForFinancing, getMyApplications, updateApplicationStatus, syncWithPartnerAPI, getAllApplications } = require('../controllers/financeController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/apply', protect, applyForFinancing);
router.get('/my-applications', protect, getMyApplications);
router.get('/admin/all', protect, adminOnly, getAllApplications);
router.put('/:id/status', protect, adminOnly, updateApplicationStatus);
router.post('/:id/sync', protect, syncWithPartnerAPI);

module.exports = router;
