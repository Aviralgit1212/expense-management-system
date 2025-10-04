const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.getLogin = (req, res) => {
    res.render('login', { error: null });
};

exports.postLogin = async (req, res) => {
    const { email, password } = req.body;
    const [rows] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length) return res.render('login', { error: 'Invalid credentials' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.render('login', { error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, process.env.JWT_SECRET || 'devoura', { expiresIn: '1d' });
    res.cookie('token', token, { httpOnly: true });
    if (user.role === 'admin') return res.redirect('/admin/dashboard');
    if (user.role === 'manager') return res.redirect('/expenses/manager');
    return res.redirect('/expenses/employee');
};

exports.getSignup = (req, res) => {
    res.render('signup', { error: null });
};

exports.postSignup = async (req, res) => {
    const { name, email, password, confirmPassword, country, phone, role } = req.body;
    if (!name || !email || !password || !confirmPassword || !country || !phone || !role) {
        return res.render('signup', { error: 'All fields are required' });
    }
    if (password.length < 4) {
        return res.render('signup', { error: 'Password must be at least 4 characters' });
    }
    if (password !== confirmPassword) {
        return res.render('signup', { error: 'Passwords do not match' });
    }
    try {
        const [existing] = await db.promise().query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length) {
            return res.render('signup', { error: 'Email already exists' });
        }
        const hashed = await bcrypt.hash(password, 10);
        // If your users table does not have country/phone columns, remove them from the query below
        await db.promise().query(
            'INSERT INTO users (name, email, password, role, country, phone) VALUES (?, ?, ?, ?, ?, ?)',
            [name, email, hashed, role, country, phone]
        );
        res.redirect('/login');
    } catch (e) {
        res.render('signup', { error: 'Server error' });
    }
};

exports.logout = (req, res) => {
    res.clearCookie('token');
    res.redirect('/login');
};
