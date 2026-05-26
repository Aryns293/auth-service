const router = require('express').Router();
const { getProfile, getAllUsers, updateRole } = require('../controllers/user.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.get('/profile', authenticate, getProfile);
router.get('/', authenticate, authorize('ADMIN'), getAllUsers);
router.patch('/:id/role', authenticate, authorize('ADMIN'), updateRole);

module.exports = router;