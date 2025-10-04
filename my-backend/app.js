const express = require('express');
const app = express();
const db = require('./db');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expenses');
const usersRoutes = require('./routes/users');
const approvalRulesRoutes = require('./routes/approvalRules');

app.use('/', authRoutes);
app.use('/expenses', expenseRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/approval-rules', approvalRulesRoutes);

// Home route
app.get('/home', (req, res) => {
    res.render('home');
});

// Dashboard route
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).render('404');
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('500');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});