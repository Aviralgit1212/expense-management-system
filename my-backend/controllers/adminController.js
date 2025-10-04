const db = require('../config/db');
const bcrypt = require('bcrypt');

exports.dashboard = async (req, res) => {
    const [users] = await db.promise().query('SELECT id, name, email, role, country, phone FROM users');
    res.render('adminDashboard', { users, error: null });
};

exports.addUser = async (req, res) => {
    const { name, email, role, password, country, phone } = req.body;
    if (!password || password.length < 4) {
        const [users] = await db.promise().query('SELECT id, name, email, role, country, phone FROM users');
        return res.render('adminDashboard', { users, error: 'Password is required (min 4 chars)' });
    }
    const hashed = await bcrypt.hash(password, 10);
    try {
        await db.promise().query(
            'INSERT INTO users (name, email, password, role, country, phone) VALUES (?, ?, ?, ?, ?, ?)',
            [name, email, hashed, role, country, phone]
        );
        res.redirect('/admin/dashboard');
    } catch (e) {
        const [users] = await db.promise().query('SELECT id, name, email, role, country, phone FROM users');
        res.render('adminDashboard', { users, error: 'Email already exists' });
    }
};

exports.listUsers = async (req, res) => {
    const [users] = await db.promise().query('SELECT id, name, email, role, country, phone FROM users');
    res.json(users);
};

exports.deleteUser = async (req, res) => {
    await db.promise().query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.redirect('/admin/dashboard');
};

exports.updateUserRole = async (req, res) => {
    const { role } = req.body;
    await db.promise().query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
    res.redirect('/admin/dashboard');
};

exports.allExpenses = async (req, res) => {
    const [expenses] = await db.promise().query(
        `SELECT e.*, u.name FROM expenses e JOIN users u ON e.user_id = u.id`
    );
    res.render('adminExpenses', { expenses });
};

// Approval Rules
exports.listApprovalRules = async (req, res) => {
    const [rules] = await db.promise().query(
        `SELECT ar.*, u.name as manager_name FROM approval_rules ar LEFT JOIN users u ON ar.manager_id = u.id`
    );
    // For dropdowns
    const [users] = await db.promise().query('SELECT id, name FROM users WHERE role IN ("manager", "employee")');
    // For each rule, get approvers
    for (const rule of rules) {
        const [approvers] = await db.promise().query(
            `SELECT a.*, u.name FROM approval_rule_approvers a JOIN users u ON a.approver_id = u.id WHERE a.rule_id = ? ORDER BY a.sequence ASC`, [rule.id]
        );
        rule.approvers = approvers;
    }
    res.render('approvalRules', { rules, users });
};

exports.createApprovalRule = async (req, res) => {
    const {
        user_or_group, description, manager_id, is_manager_approver,
        is_sequential, min_approval_percentage, approvers // approvers: [{approver_id, required, sequence]]
    } = req.body;
    if (!user_or_group || !description || !manager_id || !min_approval_percentage || !approvers || !approvers.length) {
        return res.status(400).send('All fields are required');
    }
    const conn = db.promise();
    const [result] = await conn.query(
        `INSERT INTO approval_rules (user_or_group, description, manager_id, is_manager_approver, is_sequential, min_approval_percentage)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [user_or_group, description, manager_id, !!is_manager_approver, !!is_sequential, min_approval_percentage]
    );
    const ruleId = result.insertId;
    for (const a of approvers) {
        await conn.query(
            `INSERT INTO approval_rule_approvers (rule_id, approver_id, required, sequence)
             VALUES (?, ?, ?, ?)`,
            [ruleId, a.approver_id, !!a.required, is_sequential ? a.sequence : null]
        );
    }
    res.redirect('/admin/approval-rules');
};

exports.getApprovalRule = async (req, res) => {
    const ruleId = req.params.id;
    const [[rule]] = await db.promise().query(
        `SELECT * FROM approval_rules WHERE id = ?`, [ruleId]
    );
    const [approvers] = await db.promise().query(
        `SELECT a.*, u.name FROM approval_rule_approvers a JOIN users u ON a.approver_id = u.id WHERE a.rule_id = ? ORDER BY a.sequence ASC`, [ruleId]
    );
    const [users] = await db.promise().query('SELECT id, name FROM users WHERE role IN ("manager", "employee")');
    res.render('approvalRuleEdit', { rule, approvers, users });
};

exports.updateApprovalRule = async (req, res) => {
    const ruleId = req.params.id;
    const {
        user_or_group, description, manager_id, is_manager_approver,
        is_sequential, min_approval_percentage, approvers
    } = req.body;
    if (!user_or_group || !description || !manager_id || !min_approval_percentage || !approvers || !approvers.length) {
        return res.status(400).send('All fields are required');
    }
    const conn = db.promise();
    await conn.query(
        `UPDATE approval_rules SET user_or_group=?, description=?, manager_id=?, is_manager_approver=?, is_sequential=?, min_approval_percentage=?
         WHERE id=?`,
        [user_or_group, description, manager_id, !!is_manager_approver, !!is_sequential, min_approval_percentage, ruleId]
    );
    await conn.query(`DELETE FROM approval_rule_approvers WHERE rule_id=?`, [ruleId]);
    for (const a of approvers) {
        await conn.query(
            `INSERT INTO approval_rule_approvers (rule_id, approver_id, required, sequence)
             VALUES (?, ?, ?, ?)`,
            [ruleId, a.approver_id, !!a.required, is_sequential ? a.sequence : null]
        );
    }
    res.redirect('/admin/approval-rules');
};

exports.deleteApprovalRule = async (req, res) => {
    const ruleId = req.params.id;
    await db.promise().query(`DELETE FROM approval_rule_approvers WHERE rule_id=?`, [ruleId]);
    await db.promise().query(`DELETE FROM approval_rules WHERE id=?`, [ruleId]);
    res.redirect('/admin/approval-rules');
};
