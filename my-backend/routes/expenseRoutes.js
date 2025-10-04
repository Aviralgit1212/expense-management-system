const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { isAuthenticated, isEmployee, isManager } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Employee
router.get('/employee', isAuthenticated, isEmployee, expenseController.employeeDashboard);
router.post('/submit', isAuthenticated, isEmployee, expenseController.submitExpense);
router.get('/my', isAuthenticated, isEmployee, expenseController.myExpenses);
router.post('/ocr-receipt', isAuthenticated, isEmployee, upload.single('receipt'), expenseController.ocrReceipt);
router.post('/edit/:id', isAuthenticated, isEmployee, expenseController.editExpense);
router.post('/cancel/:id', isAuthenticated, isEmployee, expenseController.cancelExpense);
router.post('/submit/:id', isAuthenticated, isEmployee, expenseController.submitExpense);
router.get('/employee/summary', isAuthenticated, isEmployee, expenseController.employeeSummary);

// Manager
router.get('/manager', isAuthenticated, isManager, expenseController.managerDashboard);
router.get('/manager/approvals', isAuthenticated, isManager, expenseController.approvalsToReview);
router.post('/approve/:id', isAuthenticated, isManager, expenseController.approveExpense);
router.post('/reject/:id', isAuthenticated, isManager, expenseController.rejectExpense);

module.exports = router;
