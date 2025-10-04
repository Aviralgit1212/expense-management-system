const db = require('../db');

// Get all approval rules for admin view
exports.getAllRules = async (req, res) => {
    const [rules] = await db.query(`
        SELECT ar.*, u.name as user_name, m.name as manager_name
        FROM approval_rules ar
        JOIN users u ON ar.user_id = u.id
        LEFT JOIN users m ON ar.manager_id = m.id
    `);
    for (const rule of rules) {
        const [approvers] = await db.query(`
            SELECT ara.*, u.name as approver_name
            FROM approval_rule_approvers ara
            JOIN users u ON ara.approver_id = u.id
            WHERE ara.rule_id = ?
            ORDER BY ara.sequence ASC
        `, [rule.id]);
        rule.approvers = approvers;
    }
    res.json(rules);
};

// Create or update an approval rule
exports.saveRule = async (req, res) => {
    const {
        id, user_id, description, manager_id, is_manager_approver,
        approvers_sequence, min_approval_percentage, approvers
    } = req.body;

    let ruleId = id;
    if (!id) {
        const [result] = await db.query(
            `INSERT INTO approval_rules (user_id, description, manager_id, is_manager_approver, approvers_sequence, min_approval_percentage)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [user_id, description, manager_id, !!is_manager_approver, !!approvers_sequence, min_approval_percentage]
        );
        ruleId = result.insertId;
    } else {
        await db.query(
            `UPDATE approval_rules SET user_id=?, description=?, manager_id=?, is_manager_approver=?, approvers_sequence=?, min_approval_percentage=?
             WHERE id=?`,
            [user_id, description, manager_id, !!is_manager_approver, !!approvers_sequence, min_approval_percentage, id]
        );
        await db.query(`DELETE FROM approval_rule_approvers WHERE rule_id=?`, [id]);
    }

    // Insert approvers
    for (let i = 0; i < approvers.length; i++) {
        const a = approvers[i];
        await db.query(
            `INSERT INTO approval_rule_approvers (rule_id, approver_id, sequence, required)
             VALUES (?, ?, ?, ?)`,
            [ruleId, a.approver_id, i, !!a.required]
        );
    }
    res.json({ success: true, ruleId });
};

// Delete an approval rule
exports.deleteRule = async (req, res) => {
    const { id } = req.params;
    await db.query(`DELETE FROM approval_rule_approvers WHERE rule_id=?`, [id]);
    await db.query(`DELETE FROM approval_rules WHERE id=?`, [id]);
    res.json({ success: true });
};
