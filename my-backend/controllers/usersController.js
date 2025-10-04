const db = require('../db');
exports.getUsers = async (req, res) => {
    const role = req.query.role;
    let sql = 'SELECT id, name, manager_id FROM users';
    let params = [];
    if (role) {
        sql += ' WHERE role = ?';
        params.push(role);
    }
    const [users] = await db.query(sql, params);
    res.json(users);
};
