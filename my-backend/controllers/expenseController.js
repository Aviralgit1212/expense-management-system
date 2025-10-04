const db = require('../config/db');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // For file uploads

exports.employeeDashboard = async (req, res) => {
    const [expenses] = await db.promise().query(
        'SELECT * FROM expenses WHERE user_id = ?', [req.user.id]
    );
    res.render('employeeDashboard', { expenses, user: req.user });
};

// OCR Receipt Upload (stub, replace with real OCR integration)
exports.ocrReceipt = async (req, res) => {
    // Here you would call your OCR service and extract fields from req.file
    // For now, return dummy data
    res.json({
        amount: 123.45,
        date: '2024-06-01',
        vendor: 'Sample Vendor',
        description: 'Sample OCR description'
    });
};

// Update expense (edit)
exports.editExpense = async (req, res) => {
    const { id } = req.params;
    const { description, amount, category, paid_by, currency, date, remarks } = req.body;
    await db.promise().query(
        'UPDATE expenses SET description=?, amount=?, category=?, paid_by=?, currency=?, date=?, remarks=? WHERE id=? AND user_id=? AND status IN ("draft","rejected")',
        [description, amount, category, paid_by, currency, date, remarks, id, req.user.id]
    );
    res.redirect('/expenses/employee');
};

// Cancel expense
exports.cancelExpense = async (req, res) => {
    const { id } = req.params;
    await db.promise().query(
        'UPDATE expenses SET status="cancelled" WHERE id=? AND user_id=? AND status IN ("submitted","waiting approval")',
        [id, req.user.id]
    );
    res.redirect('/expenses/employee');
};

// Submit expense (change status from draft to waiting approval)
exports.submitExpense = async (req, res) => {
    const { id } = req.params;
    await db.promise().query(
        'UPDATE expenses SET status="waiting approval" WHERE id=? AND user_id=? AND status="draft"',
        [id, req.user.id]
    );
    // TODO: Trigger approval workflow according to approval rules
    res.redirect('/expenses/employee');
};

// Employee analytics/summary
exports.employeeSummary = async (req, res) => {
    const [draft] = await db.promise().query('SELECT SUM(amount) as total FROM expenses WHERE user_id=? AND status="draft"', [req.user.id]);
    const [waiting] = await db.promise().query('SELECT SUM(amount) as total FROM expenses WHERE user_id=? AND status="waiting approval"', [req.user.id]);
    const [approved] = await db.promise().query('SELECT SUM(amount) as total FROM expenses WHERE user_id=? AND status="approved"', [req.user.id]);
    res.json({
        draft: draft[0].total || 0,
        waiting: waiting[0].total || 0,
        approved: approved[0].total || 0
    });
};

exports.myExpenses = async (req, res) => {
    const [expenses] = await db.promise().query(
        'SELECT * FROM expenses WHERE user_id = ?', [req.user.id]
    );
    res.json(expenses);
};

exports.managerDashboard = async (req, res) => {
    const [expenses] = await db.promise().query(
        'SELECT e.*, u.name FROM expenses e JOIN users u ON e.user_id = u.id WHERE e.status = "pending"'
    );
    res.render('managerDashboard', { expenses });
};

// Get approvals to review for the logged-in manager
exports.approvalsToReview = async (req, res) => {
    // Only show expenses assigned to this manager and still pending
    const [expenses] = await db.promise().query(
        `SELECT e.*, u.name as owner_name, u.country
         FROM expenses e
         JOIN users u ON e.user_id = u.id
         WHERE e.manager_id = ? AND e.status = 'pending'`,
        [req.user.id]
    );
    res.render('managerApprovals', { expenses, manager: req.user });
};

// Approve expense (only if still pending)
exports.approveExpense = async (req, res) => {
    const [rows] = await db.promise().query('SELECT status FROM expenses WHERE id = ?', [req.params.id]);
    if (!rows.length || rows[0].status !== 'pending') return res.redirect('/expenses/manager/approvals');
    await db.promise().query(
        'UPDATE expenses SET status = "approved" WHERE id = ?', [req.params.id]
    );
    res.redirect('/expenses/manager/approvals');
};

// Reject expense (only if still pending)
exports.rejectExpense = async (req, res) => {
    const [rows] = await db.promise().query('SELECT status FROM expenses WHERE id = ?', [req.params.id]);
    if (!rows.length || rows[0].status !== 'pending') return res.redirect('/expenses/manager/approvals');
    await db.promise().query(
        'UPDATE expenses SET status = "rejected" WHERE id = ?', [req.params.id]
    );
    res.redirect('/expenses/manager/approvals');
};
