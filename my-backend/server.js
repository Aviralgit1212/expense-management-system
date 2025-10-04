require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const db = require('./config/db');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 5000;

// EJS setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', require('./routes/authRoutes'));
app.use('/admin', require('./routes/adminRoutes'));
app.use('/expenses', require('./routes/expenseRoutes'));

// Seed admin user if not exists
(async () => {
    try {
        const [rows] = await db.promise().query('SELECT * FROM users WHERE email = ?', ['admin@devoura.com']);
        if (rows.length === 0) {
            const hashed = await bcrypt.hash('123', 10);
            await db.promise().query(
                'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                ['Admin', 'admin@devoura.com', hashed, 'admin']
            );
        }
        // Always log the admin credentials
        console.log('Admin credentials:');
        console.log('Email: admin@devoura.com');
        console.log('Password: 123');
    } catch (err) {
        console.error('Error seeding admin user:', err);
    }
})();

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
