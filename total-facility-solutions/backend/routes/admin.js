const express = require('express');
const User = require('../models/User');
const JobRequest = require('../models/JobRequest');
const { protect, requireVerified, adminOnly } = require('../middleware/auth');
const emailService = require('../utils/email');

const router = express.Router();
router.use(protect, requireVerified, adminOnly);

// ─── GET /api/admin/overview ──────────────────────────────────────
router.get('/overview', async (req, res, next) => {
  try {
    const [
      totalSeekers, activeSeekers, placedSeekers,
      totalEmployers, verifiedEmployers,
      totalRequests, pendingRequests, fulfilledRequests,
      recentSeekers, recentRequests,
    ] = await Promise.all([
      User.countDocuments({ role: 'seeker' }),
      User.countDocuments({ role: 'seeker', 'seekerProfile.applicationStatus': { $in: ['submitted', 'under_review', 'shortlisted'] } }),
      User.countDocuments({ role: 'seeker', 'seekerProfile.applicationStatus': 'placed' }),
      User.countDocuments({ role: 'employer' }),
      User.countDocuments({ role: 'employer', 'employerProfile.verificationStatus': 'verified' }),
      JobRequest.countDocuments(),
      JobRequest.countDocuments({ status: 'pending' }),
      JobRequest.countDocuments({ status: 'fulfilled' }),
      User.find({ role: 'seeker' }).sort({ createdAt: -1 }).limit(5).select('name email seekerProfile.primarySkill seekerProfile.applicationStatus avatar createdAt'),
      JobRequest.find().sort({ createdAt: -1 }).limit(5).populate('employer', 'name employerProfile.businessName'),
    ]);

    // Monthly registration data (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyData = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo }, role: { $in: ['seeker', 'employer'] } } },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' },
            role: '$role',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Skills distribution
    const skillsData = await User.aggregate([
      { $match: { role: 'seeker', 'seekerProfile.primarySkill': { $exists: true, $ne: null } } },
      { $group: { _id: '$seekerProfile.primarySkill', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);

    res.json({
      success: true,
      stats: {
        seekers: { total: totalSeekers, active: activeSeekers, placed: placedSeekers },
        employers: { total: totalEmployers, verified: verifiedEmployers },
        requests: { total: totalRequests, pending: pendingRequests, fulfilled: fulfilledRequests },
      },
      recentSeekers,
      recentRequests,
      analytics: { monthlyData, skillsData },
    });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/admin/seekers ───────────────────────────────────────
router.get('/seekers', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, skill, search, city } = req.query;
    const filter = { role: 'seeker' };

    if (status) filter['seekerProfile.applicationStatus'] = status;
    if (skill) filter['seekerProfile.primarySkill'] = skill;
    if (city) filter['seekerProfile.city'] = new RegExp(city, 'i');
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') },
      ];
    }

    const total = await User.countDocuments(filter);
    const seekers = await User.find(filter)
      .select('-password -otp.code -otp.expiresAt -otp.attempts -refreshTokens')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      seekers,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit), limit: parseInt(limit) },
    });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/admin/seekers/:id ───────────────────────────────────
router.get('/seekers/:id', async (req, res, next) => {
  try {
    const seeker = await User.findOne({ _id: req.params.id, role: 'seeker' }).select('-password -otp -refreshTokens');
    if (!seeker) return res.status(404).json({ success: false, message: 'Seeker not found.' });
    res.json({ success: true, seeker });
  } catch (error) {
    next(error);
  }
});

// ─── PATCH /api/admin/seekers/:id/status ─────────────────────────
router.patch('/seekers/:id/status', async (req, res, next) => {
  try {
    const { applicationStatus, adminNotes } = req.body;
    const validStatuses = ['draft', 'submitted', 'under_review', 'shortlisted', 'placed', 'rejected'];
    if (!validStatuses.includes(applicationStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const seeker = await User.findOne({ _id: req.params.id, role: 'seeker' });
    if (!seeker) return res.status(404).json({ success: false, message: 'Seeker not found.' });

    seeker.seekerProfile.applicationStatus = applicationStatus;
    if (adminNotes) seeker.seekerProfile.adminNotes = adminNotes;
    if (applicationStatus === 'placed') seeker.seekerProfile.placedAt = new Date();

    seeker.addNotification(
      'Application Update',
      `Your application status has been updated to: ${applicationStatus.replace('_', ' ').toUpperCase()}${adminNotes ? `. Note: ${adminNotes}` : ''}`,
      applicationStatus === 'placed' ? 'success' : applicationStatus === 'rejected' ? 'error' : 'info'
    );
    await seeker.save();

    // Email notification
    try { await emailService.sendApplicationUpdate(seeker.email, seeker.name, applicationStatus, adminNotes); } catch (e) {}

    res.json({ success: true, message: 'Seeker status updated.', seeker });
  } catch (error) {
    next(error);
  }
});

// ─── PATCH /api/admin/seekers/:id/suspend ────────────────────────
router.patch('/seekers/:id/suspend', async (req, res, next) => {
  try {
    const seeker = await User.findById(req.params.id);
    if (!seeker) return res.status(404).json({ success: false, message: 'User not found.' });
    seeker.status = seeker.status === 'suspended' ? 'active' : 'suspended';
    await seeker.save();
    res.json({ success: true, message: `Account ${seeker.status}.` });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/admin/employers ─────────────────────────────────────
router.get('/employers', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, verificationStatus } = req.query;
    const filter = { role: 'employer' };
    if (verificationStatus) filter['employerProfile.verificationStatus'] = verificationStatus;
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { 'employerProfile.businessName': new RegExp(search, 'i') },
      ];
    }

    const total = await User.countDocuments(filter);
    const employers = await User.find(filter)
      .select('-password -otp.code -otp.expiresAt -otp.attempts -refreshTokens')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Get request counts for each employer
    const employerIds = employers.map(e => e._id);
    const requestCounts = await JobRequest.aggregate([
      { $match: { employer: { $in: employerIds } } },
      { $group: { _id: '$employer', count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(requestCounts.map(r => [r._id.toString(), r.count]));

    const enriched = employers.map(e => ({
      ...e.toObject(),
      requestCount: countMap[e._id.toString()] || 0,
    }));

    res.json({ success: true, employers: enriched, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
});

// ─── PATCH /api/admin/employers/:id/verify ───────────────────────
router.patch('/employers/:id/verify', async (req, res, next) => {
  try {
    const { status } = req.body; // 'verified' | 'unverified' | 'pending'
    const employer = await User.findOne({ _id: req.params.id, role: 'employer' });
    if (!employer) return res.status(404).json({ success: false, message: 'Employer not found.' });
    employer.employerProfile.verificationStatus = status;
    employer.addNotification('Account Update', `Your employer account has been ${status}.`, status === 'verified' ? 'success' : 'info');
    await employer.save();
    res.json({ success: true, message: `Employer ${status}.` });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/admin/job-requests ─────────────────────────────────
router.get('/job-requests', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, staffType, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (staffType) filter.staffType = staffType;
    if (search) filter.$or = [{ title: new RegExp(search, 'i') }, { location: new RegExp(search, 'i') }];

    const total = await JobRequest.countDocuments(filter);
    const requests = await JobRequest.find(filter)
      .populate('employer', 'name email phone employerProfile.businessName avatar')
      .populate('matchedSeekers.seeker', 'name email phone seekerProfile.primarySkill avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, jobRequests: requests, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
});

// ─── PATCH /api/admin/job-requests/:id/status ────────────────────
router.patch('/job-requests/:id/status', async (req, res, next) => {
  try {
    const { status, adminNotes, rejectionReason } = req.body;
    const request = await JobRequest.findById(req.params.id).populate('employer', 'name email');
    if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });

    request.status = status;
    if (adminNotes) request.adminNotes = adminNotes;
    if (rejectionReason) request.rejectionReason = rejectionReason;
    if (status === 'under_review') request.reviewedAt = new Date();
    if (status === 'fulfilled') request.fulfilledAt = new Date();
    request.reviewedBy = req.user._id;
    await request.save();

    // Notify employer
    const employer = await User.findById(request.employer._id);
    if (employer) {
      employer.addNotification('Request Update', `Your staff request "${request.title}" status: ${status.replace('_', ' ').toUpperCase()}`, 'info');
      await employer.save();
      try { await emailService.sendStaffRequestUpdate(employer.email, employer.name, request.title, status); } catch (e) {}
    }

    res.json({ success: true, message: 'Request status updated.', request });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/admin/job-requests/:id/match-seeker ───────────────
router.post('/job-requests/:id/match-seeker', async (req, res, next) => {
  try {
    const { seekerId, adminNote } = req.body;

    const [request, seeker] = await Promise.all([
      JobRequest.findById(req.params.id).populate('employer', 'name email'),
      User.findOne({ _id: seekerId, role: 'seeker' }),
    ]);

    if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });
    if (!seeker) return res.status(404).json({ success: false, message: 'Seeker not found.' });

    const alreadyMatched = request.matchedSeekers.some(m => m.seeker.toString() === seekerId);
    if (alreadyMatched) return res.status(400).json({ success: false, message: 'Seeker already matched to this request.' });

    request.matchedSeekers.push({ seeker: seekerId, adminNote });
    if (request.status === 'pending' || request.status === 'under_review') request.status = 'in_progress';
    await request.save();

    // Notify both parties
    seeker.addNotification('Matched!', `You've been matched to a ${request.staffType} position at ${request.employer?.name || 'a company'}. Check your dashboard!`, 'success');
    await seeker.save();

    const employer = await User.findById(request.employer._id);
    if (employer) {
      employer.addNotification('New Match', `A candidate has been matched to your "${request.title}" request.`, 'success');
      await employer.save();
      try { await emailService.sendMatchNotification(employer.email, employer.name, request.title, seeker.name); } catch (e) {}
    }

    res.json({ success: true, message: `${seeker.name} matched successfully.` });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/admin/seekers-for-matching ─────────────────────────
router.get('/seekers-for-matching', async (req, res, next) => {
  try {
    const { skill, city } = req.query;
    const filter = {
      role: 'seeker',
      'seekerProfile.applicationStatus': { $in: ['submitted', 'under_review', 'shortlisted'] },
    };
    if (skill) filter['seekerProfile.primarySkill'] = new RegExp(skill, 'i');
    if (city) filter['seekerProfile.city'] = new RegExp(city, 'i');

    const seekers = await User.find(filter)
      .select('name email phone avatar seekerProfile.primarySkill seekerProfile.experience seekerProfile.city seekerProfile.expectedSalary')
      .limit(50);

    res.json({ success: true, seekers });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/admin/broadcast-notification ──────────────────────
router.post('/broadcast-notification', async (req, res, next) => {
  try {
    const { title, message, type = 'info', targetRole } = req.body;
    const filter = targetRole ? { role: targetRole } : { role: { $in: ['seeker', 'employer'] } };

    const users = await User.find(filter).select('_id');
    await User.updateMany(filter, {
      $push: {
        notifications: {
          $each: [{ title, message, type, createdAt: new Date() }],
          $position: 0,
        },
      },
    });

    res.json({ success: true, message: `Notification sent to ${users.length} users.` });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
