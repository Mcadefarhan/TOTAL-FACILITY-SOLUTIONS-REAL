const express = require('express');
const { protect, requireVerified } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();
router.use(protect, requireVerified);

// GET /api/users/me - Get current user full profile
router.get('/me', (req, res) => {
  const u = req.user;
  res.json({
    success: true,
    user: {
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      phone: u.phone,
      avatar: u.avatar,
      status: u.status,
      isVerified: u.isVerified,
      seekerProfile: u.seekerProfile,
      employerProfile: u.employerProfile,
      notifications: u.notifications,
      unreadNotifications: u.unreadNotifications,
      createdAt: u.createdAt,
    },
  });
});

// PATCH /api/users/me - Update basic user fields
router.patch('/me', async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    if (name) req.user.name = name;
    if (phone) req.user.phone = phone;
    await req.user.save();
    res.json({ success: true, message: 'Profile updated.' });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/users/change-password
router.patch('/change-password', async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
    }

    user.password = newPassword;
    user.refreshTokens = []; // Invalidate all sessions
    await user.save();
    res.json({ success: true, message: 'Password changed. Please log in again.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
