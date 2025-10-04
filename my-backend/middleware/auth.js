const jwt = require('jsonwebtoken');

function isAuthenticated(req, res, next) {
    const token = req.cookies.token;
    if (!token) return res.redirect('/login');
    try {
        const user = jwt.verify(token, process.env.JWT_SECRET || 'devoura');
        req.user = user;
        next();
    } catch {
        res.redirect('/login');
    }
}

function isAdmin(req, res, next) {
    if (req.user.role === 'admin') return next();
    res.status(403).send('Forbidden');
}

function isManager(req, res, next) {
    if (req.user.role === 'manager') return next();
    res.status(403).send('Forbidden');
}

function isEmployee(req, res, next) {
    if (req.user.role === 'employee') return next();
    res.status(403).send('Forbidden');
}

module.exports = { isAuthenticated, isAdmin, isManager, isEmployee };
