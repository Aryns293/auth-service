const prisma = require('../config/db');

// GET /api/users/profile  (any logged in user)
const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, role: true, createdAt: true }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// GET /api/users  (ADMIN only)
const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ total: users.length, users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// PATCH /api/users/:id/role  (ADMIN only)
const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['ADMIN', 'USER', 'GUEST'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be ADMIN, USER, or GUEST' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, role: true }
    });

    res.json({ message: 'Role updated successfully', user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update role' });
  }
};

module.exports = { getProfile, getAllUsers, updateRole };