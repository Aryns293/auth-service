const router = require('express').Router();
const { register, login, refresh, logout } = require('../controllers/auth.controller');
const { loginLimiter } = require('../middleware/rateLimiter');

router.post('/register', register);
router.post('/login', loginLimiter, login);  // Rate limited!
router.post('/refresh', refresh);
router.post('/logout', logout);

module.exports = router;