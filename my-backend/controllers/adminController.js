const db = require('../config/db');
const bcrypt = require('bcrypt');

// Helper to fetch users (DRY)
async function fetchUsers() {
    const [users] = await db.promise().query('SELECT id, name, email, role, country, phone FROM users');
    return users;
}

// Password complexity check
function isPasswordValid(password) {
    // At least 8 chars, 1 uppercase, 1 lowercase, 1 number
    return typeof password === 'string' &&
        password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /\d/.test(password);
}

exports.dashboard = async (req, res) => {
    try {
        const users = await fetchUsers();
        res.render('adminDashboard', { users, error: null });
    } catch (err) {
        res.status(500).render('adminDashboard', { users: [], error: 'Server error' });
    }
};

exports.addUser = async (req, res) => {
    const { name, email, role, password, country, phone } = req.body;
    if (!isPasswordValid(password)) {
        const users = await fetchUsers();
        return res.render('adminDashboard', { users, error: 'Password must be at least 8 chars, include uppercase, lowercase, and number.' });
    }
    try {
        const hashed = await bcrypt.hash(password, 10);
        await db.promise().query(
            'INSERT INTO users (name, email, password, role, country, phone) VALUES (?, ?, ?, ?, ?, ?)',
            [name, email, hashed, role, country, phone]
        );
        res.redirect('/admin/dashboard');
    } catch (e) {
        const users = await fetchUsers();
        res.render('adminDashboard', { users, error: 'Email already exists' });
    }
};

exports.listUsers = async (req, res) => {
    try {
        const users = await fetchUsers();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        // Prevent admin self-deletion
        if (req.user && req.user.id == userId) {
            const users = await fetchUsers();
            return res.render('adminDashboard', { users, error: 'You cannot delete your own admin account.' });
        }
        const [result] = await db.promise().query('DELETE FROM users WHERE id = ?', [userId]);
        if (result.affectedRows === 0) {
            const users = await fetchUsers();
            return res.render('adminDashboard', { users, error: 'User not found.' });
        }
        res.redirect('/admin/dashboard');
    } catch (err) {
        const users = await fetchUsers();
        res.render('adminDashboard', { users, error: 'Server error.' });
    }
};

exports.updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const userId = req.params.id;
        const [result] = await db.promise().query('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
        if (result.affectedRows === 0) {
            const users = await fetchUsers();
            return res.render('adminDashboard', { users, error: 'User not found.' });
        }
        res.redirect('/admin/dashboard');
    } catch (err) {
        const users = await fetchUsers();
        res.render('adminDashboard', { users, error: 'Server error.' });
    }
};

exports.allExpenses = async (req, res) => {
    try {
        const [expenses] = await db.promise().query(
            `SELECT e.*, u.name FROM expenses e JOIN users u ON e.user_id = u.id`
        );
        res.render('adminExpenses', { expenses });
    } catch (err) {
        res.status(500).render('adminExpenses', { expenses: [], error: 'Server error.' });
    }
};

// Approval Rules
exports.listApprovalRules = async (req, res) => {
    try {
        const [rules] = await db.promise().query(
            `SELECT ar.*, u.name as manager_name FROM approval_rules ar LEFT JOIN users u ON ar.manager_id = u.id`
        );
        const [users] = await db.promise().query('SELECT id, name FROM users WHERE role IN ("manager", "employee")');
        for (const rule of rules) {
            const [approvers] = await db.promise().query(
                `SELECT a.*, u.name FROM approval_rule_approvers a JOIN users u ON a.approver_id = u.id WHERE a.rule_id = ? ORDER BY a.sequence ASC`, [rule.id]
            );
            rule.approvers = approvers;
        }
        res.render('approvalRules', { rules, users });
    } catch (err) {
        res.status(500).render('approvalRules', { rules: [], users: [], error: 'Server error.' });
    }
};

exports.createApprovalRule = async (req, res) => {
    try {
        const {
            user_or_group, description, manager_id, is_manager_approver,
            is_sequential, min_approval_percentage, approvers
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
    } catch (err) {
        res.status(500).send('Server error.');
    }
};

exports.getApprovalRule = async (req, res) => {
    try {
        const ruleId = req.params.id;
        const [[rule]] = await db.promise().query(
            `SELECT * FROM approval_rules WHERE id = ?`, [ruleId]
        );
        const [approvers] = await db.promise().query(
            `SELECT a.*, u.name FROM approval_rule_approvers a JOIN users u ON a.approver_id = u.id WHERE a.rule_id = ? ORDER BY a.sequence ASC`, [ruleId]
        );
        const [users] = await db.promise().query('SELECT id, name FROM users WHERE role IN ("manager", "employee")');
        res.render('approvalRuleEdit', { rule, approvers, users });
    } catch (err) {
        res.status(500).render('approvalRuleEdit', { rule: null, approvers: [], users: [], error: 'Server error.' });
    }
};

exports.updateApprovalRule = async (req, res) => {
    try {
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
    } catch (err) {
        res.status(500).send('Server error.');
    }
};

exports.deleteApprovalRule = async (req, res) => {
    try {
        const ruleId = req.params.id;
        await db.promise().query(`DELETE FROM approval_rule_approvers WHERE rule_id=?`, [ruleId]);
        await db.promise().query(`DELETE FROM approval_rules WHERE id=?`, [ruleId]);
        res.redirect('/admin/approval-rules');
    } catch (err) {
        res.status(500).send('Server error.');
    }
};

// Note: Add CSRF protection in your Express app using csurf middleware, not here.

