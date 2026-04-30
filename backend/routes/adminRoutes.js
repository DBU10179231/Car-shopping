const express = require('express');
const router = express.Router();
const {
    getAdminMetrics,
    getChartsData,
    getUsers,
    createUserByAdmin,
    updateUserByAdmin,
    updateBanStatus,
    verifySellerDocs,
    getSellerMetrics,
    deleteUser,
    changeUserRole,
    getAdminCars,
    getAdminOrders,
    updateOrderStatus,
    deleteOrder,
    getSystemHealth,
    getAnalytics,
    sendBroadcastMessage,
    revokeUserSession,
    getRoles,
    createRole,
    updateRole,
    deleteRole,
    getAuditLogs,
    getAdminReviews,
    deleteReviewByAdmin,
    getAdminCategories,
    createCategory,
    updateCarStatus,
} = require('../controllers/adminController');
const { protect, adminOnly, requirePermission } = require('../middleware/authMiddleware');

router.use(protect, adminOnly); // All admin routes require admin token

router.get('/metrics', getAdminMetrics);
router.get('/charts', getChartsData);
router.get('/analytics', getAnalytics);
router.get('/system', getSystemHealth);
router.get('/users', getUsers);
router.post('/users', requirePermission('create_users'), createUserByAdmin);
router.put('/users/:id', requirePermission('edit_users'), updateUserByAdmin);
router.get('/cars', getAdminCars);
router.get('/orders', getAdminOrders);
router.get('/sellers/:id/metrics', getSellerMetrics);
router.get('/roles', getRoles);
router.get('/audit-logs', getAuditLogs);
router.post('/roles', requirePermission('manage_roles'), createRole);
router.put('/roles/:id', requirePermission('manage_roles'), updateRole);
router.delete('/roles/:id', requirePermission('manage_roles'), deleteRole);
router.put('/users/:id/ban', requirePermission('edit_users'), updateBanStatus);
router.put('/sellers/:id/verify-docs', requirePermission('edit_users'), verifySellerDocs);
router.put('/users/:id/verify', requirePermission('edit_users'), verifySellerDocs);

router.put('/users/:id/role', requirePermission('assign_roles'), changeUserRole);
router.put('/users/:id/revoke-sessions', requirePermission('edit_users'), revokeUserSession);
router.put('/orders/:id/status', requirePermission('manage_orders'), updateOrderStatus);
router.put('/cars/:id/status', requirePermission('manage_listings'), updateCarStatus);

router.get('/reviews', requirePermission('manage_reviews'), getAdminReviews);
router.delete('/reviews/:id', requirePermission('manage_reviews'), deleteReviewByAdmin);

router.get('/categories', getAdminCategories);
router.post('/categories', requirePermission('manage_catalog'), createCategory);

router.delete('/users/:id', requirePermission('delete_users'), deleteUser);
router.delete('/orders/:id', requirePermission('delete_orders'), deleteOrder);
router.post('/broadcast', requirePermission('send_broadcast'), sendBroadcastMessage);

module.exports = router;
