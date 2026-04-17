const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect, requireVerified, seekerOnly, adminOnly } = require('../middleware/auth');

const router = express.Router();

// All seeker routes require auth
router.use(protect, requireVerified);

// ─── GET /api/seekers/profile ─────────────────────────────────────
router.get('/profile', seekerOnly, (req, res) => {
  res.json({ success: true, profile: req.user.seekerProfile, user: { name: req.user.name, email: req.user.email, phone: req.user.phone, avatar: req.user.avatar } });
});

// ─── PUT /api/seekers/profile ─────────────────────────────────────
router.put('/profile', seekerOnly, [
  body('skills').optional().isArray().withMessage('Skills must be an array'),
  body('expectedSalary').optional().isNumeric().withMessage('Expected salary must be a number'),
  body('willingToRelocate').optional().isBoolean(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const allowedFields = [
      'fatherName', 'address', 'city', 'state', 'pincode',
      'qualification', 'school', 'skills', 'primarySkill', 'experience',
      'previousWork', 'lastCompany', 'preferredShift', 'workTiming',
      'willingToRelocate', 'expectedSalary', 'documentsSubmitted',
    ];

    // Also allow top-level user fields
    const userFields = ['name', 'phone'];
    for (const field of userFields) {
      if (req.body[field] !== undefined) req.user[field] = req.body[field];
    }

    if (!req.user.seekerProfile) req.user.seekerProfile = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        req.user.seekerProfile[field] = req.body[field];
      }
    }

    await req.user.save();
    res.json({ success: true, message: 'Profile updated successfully.', profile: req.user.seekerProfile });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/seekers/submit-application ────────────────────────
router.post('/submit-application', seekerOnly, async (req, res, next) => {
  try {
    const profile = req.user.seekerProfile;

    // Validate required fields
    const requiredFields = ['address', 'skills', 'experience', 'preferredShift'];
    const missing = requiredFields.filter(f => !profile?.[f] || (Array.isArray(profile[f]) && profile[f].length === 0));

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Please complete your profile first. Missing: ${missing.join(', ')}`,
      });
    }

    if (profile.applicationStatus === 'submitted' || profile.applicationStatus === 'under_review') {
      return res.status(400).json({ success: false, message: 'Application already submitted and under review.' });
    }

    req.user.seekerProfile.applicationStatus = 'submitted';
    req.user.seekerProfile.submittedAt = new Date();
    req.user.addNotification('Application Submitted', 'Your job application has been submitted. Our team will review it within 24 hours.', 'success');
    await req.user.save();

    res.json({ success: true, message: 'Application submitted successfully! We will review it within 24 hours.' });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/seekers/my-status ──────────────────────────────────
router.get('/my-status', seekerOnly, (req, res) => {
  const profile = req.user.seekerProfile;
  res.json({
    success: true,
    applicationStatus: profile?.applicationStatus || 'draft',
    submittedAt: profile?.submittedAt,
    placedAt: profile?.placedAt,
    adminNotes: profile?.adminNotes,
  });
});

// ─── GET /api/seekers/notifications ──────────────────────────────
router.get('/notifications', (req, res) => {
  res.json({ success: true, notifications: req.user.notifications, unread: req.user.unreadNotifications });
});

// ─── PATCH /api/seekers/mark-notifications-read ──────────────────
router.patch('/mark-notifications-read', async (req, res, next) => {
  try {
    req.user.notifications.forEach(n => { n.read = true; });
    await req.user.save();
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
