const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Redirect root to EJS login page
router.get('/', (req, res) => {
    res.redirect('/login');
});

// Login page (EJS)
router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);

// Signup page (open signup)
router.get('/signup', authController.getSignup);
router.post('/signup', authController.postSignup);

// Logout
router.get('/logout', authController.logout);

module.exports = router;
router.post('/signup', authController.postSignup);

// Logout
router.get('/logout', authController.logout);

module.exports = router;
