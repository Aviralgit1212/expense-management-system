const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Admin dashboard
router.get('/dashboard', isAuthenticated, isAdmin, adminController.dashboard);

// User management
router.post('/add-user', isAuthenticated, isAdmin, adminController.addUser);
router.get('/users', isAuthenticated, isAdmin, adminController.listUsers);
router.post('/delete-user/:id', isAuthenticated, isAdmin, adminController.deleteUser);
router.post('/update-role/:id', isAuthenticated, isAdmin, adminController.updateUserRole);

// Expenses management
router.get('/expenses', isAuthenticated, isAdmin, adminController.allExpenses);

// Approval Rules
router.get('/approval-rules', isAuthenticated, isAdmin, adminController.listApprovalRules);
router.post('/approval-rules', isAuthenticated, isAdmin, adminController.createApprovalRule);
router.get('/approval-rules/:id', isAuthenticated, isAdmin, adminController.getApprovalRule);
router.post('/approval-rules/:id', isAuthenticated, isAdmin, adminController.updateApprovalRule);
router.post('/approval-rules/:id/delete', isAuthenticated, isAdmin, adminController.deleteApprovalRule);

module.exports = router;
