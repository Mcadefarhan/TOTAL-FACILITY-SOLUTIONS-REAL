const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const JobRequest = require('../models/JobRequest');
const { protect, requireVerified, employerOnly } = require('../middleware/auth');
const emailService = require('../utils/email');

const router = express.Router();
router.use(protect, requireVerified);

// ─── GET /api/employers/profile ───────────────────────────────────
router.get('/profile', employerOnly, (req, res) => {
  res.json({
    success: true,
    profile: req.user.employerProfile,
    user: { name: req.user.name, email: req.user.email, phone: req.user.phone, avatar: req.user.avatar },
  });
});

// ─── PUT /api/employers/profile ───────────────────────────────────
router.put('/profile', employerOnly, async (req, res, next) => {
  try {
    const { name, phone, businessName, businessType, gstNumber, businessAddress, city, state, website, description } = req.body;

    if (name) req.user.name = name;
    if (phone) req.user.phone = phone;

    if (!req.user.employerProfile) req.user.employerProfile = {};
    Object.assign(req.user.employerProfile, { businessName, businessType, gstNumber, businessAddress, city, state, website, description });

    await req.user.save();
    res.json({ success: true, message: 'Profile updated.', profile: req.user.employerProfile });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/employers/job-requests ────────────────────────────
router.post('/job-requests', employerOnly, [
  body('title').trim().notEmpty().withMessage('Job title required'),
  body('staffType').isIn(['Housekeeping', 'Security Guard', 'Office Boy', 'Salesman', 'Receptionist', 'Driver', 'Cook', 'Helper', 'Supervisor', 'Peon', 'Watchman', 'Sweeper', 'Other']).withMessage('Invalid staff type'),
  body('numberOfStaff').isInt({ min: 1, max: 500 }).withMessage('Number of staff must be between 1 and 500'),
  body('location').trim().notEmpty().withMessage('Location required'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const jobRequest = await JobRequest.create({
      employer: req.user._id,
      ...req.body,
    });

    req.user.addNotification('Request Submitted', `Your staff request "${req.body.title}" has been submitted and is pending review.`, 'success');
    await req.user.save();

    res.status(201).json({ success: true, message: 'Staff request submitted successfully.', jobRequest });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/employers/job-requests ─────────────────────────────
router.get('/job-requests', employerOnly, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { employer: req.user._id };
    if (status) filter.status = status;

    const total = await JobRequest.countDocuments(filter);
    const requests = await JobRequest.find(filter)
      .populate('matchedSeekers.seeker', 'name email phone avatar seekerProfile.primarySkill')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      jobRequests: requests,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/employers/job-requests/:id ─────────────────────────
router.get('/job-requests/:id', employerOnly, async (req, res, next) => {
  try {
    const request = await JobRequest.findOne({ _id: req.params.id, employer: req.user._id })
      .populate('matchedSeekers.seeker', 'name email phone avatar seekerProfile');
    if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });
    res.json({ success: true, jobRequest: request });
  } catch (error) {
    next(error);
  }
});

// ─── PATCH /api/employers/job-requests/:id/cancel ────────────────
router.patch('/job-requests/:id/cancel', employerOnly, async (req, res, next) => {
  try {
    const request = await JobRequest.findOne({ _id: req.params.id, employer: req.user._id });
    if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });
    if (['fulfilled', 'cancelled'].includes(request.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel this request.' });
    }
    request.status = 'cancelled';
    await request.save();
    res.json({ success: true, message: 'Request cancelled.' });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/employers/dashboard-stats ──────────────────────────
router.get('/dashboard-stats', employerOnly, async (req, res, next) => {
  try {
    const [total, pending, inProgress, fulfilled] = await Promise.all([
      JobRequest.countDocuments({ employer: req.user._id }),
      JobRequest.countDocuments({ employer: req.user._id, status: 'pending' }),
      JobRequest.countDocuments({ employer: req.user._id, status: 'in_progress' }),
      JobRequest.countDocuments({ employer: req.user._id, status: 'fulfilled' }),
    ]);
    res.json({ success: true, stats: { total, pending, inProgress, fulfilled } });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/employers/notifications ────────────────────────────
router.get('/notifications', employerOnly, (req, res) => {
  res.json({ success: true, notifications: req.user.notifications, unread: req.user.unreadNotifications });
});

router.patch('/mark-notifications-read', employerOnly, async (req, res, next) => {
  try {
    req.user.notifications.forEach(n => { n.read = true; });
    await req.user.save();
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
