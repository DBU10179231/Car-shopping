const express = require('express');
const router = express.Router();
const {
    getReportData,
    exportReport,
    getScheduledReports,
    createScheduledReport,
    deleteScheduledReport
} = require('../controllers/reportController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect, adminOnly);

router.get('/data/:type', getReportData);
router.post('/export', exportReport);
router.get('/scheduled', getScheduledReports);
router.post('/scheduled', createScheduledReport);
router.delete('/scheduled/:id', deleteScheduledReport);

module.exports = router;
