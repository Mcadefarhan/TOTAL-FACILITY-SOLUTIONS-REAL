const express = require('express');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken, getTokenExpiry } = require('../utils/jwt');
const emailService = require('../utils/email');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ─── Validation Rules ─────────────────────────────────────────────
const registerValidation = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase and a number'),
  body('role').isIn(['seeker', 'employer']).withMessage('Role must be seeker or employer'),
  body('phone').optional().matches(/^[6-9]\d{9}$/).withMessage('Enter valid Indian mobile number'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// ─── Helpers ──────────────────────────────────────────────────────
const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  return null;
};

const issueTokens = async (user, res) => {
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  // Store refresh token
  user.refreshTokens.push({
    token: refreshToken,
    expiresAt: getTokenExpiry(30),
  });
  // Keep only last 5 refresh tokens
  if (user.refreshTokens.length > 5) {
    user.refreshTokens = user.refreshTokens.slice(-5);
  }
  user.lastLogin = new Date();
  await user.save();

  return { accessToken, refreshToken };
};

// ─── POST /api/auth/register ──────────────────────────────────────
router.post('/register', registerValidation, async (req, res, next) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError !== null) return;

    const { name, email, password, role, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      }
      // Allow re-registration if not verified (resend OTP)
      const otp = existingUser.generateOTP();
      existingUser.name = name;
      existingUser.password = password;
      existingUser.role = role;
      if (phone) existingUser.phone = phone;
      await existingUser.save();
      await emailService.sendOTP(email, name, otp);
      return res.status(200).json({
        success: true,
        message: 'Account exists but not verified. New OTP sent to your email.',
        userId: existingUser._id,
      });
    }

    const user = await User.create({ name, email, password, role, phone });
    const otp = user.generateOTP();
    await user.save();

    try {
      await emailService.sendOTP(email, name, otp);
    } catch (emailError) {
      console.error('Email send failed during registration:', emailError.message);
      // Don't fail registration if email fails — log it
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email for the verification code.',
      userId: user._id,
      // In development, return OTP directly (remove in production!)
      ...(process.env.NODE_ENV === 'development' && { devOtp: otp }),
    });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/auth/verify-otp ────────────────────────────────────
router.post('/verify-otp', async (req, res, next) => {
  try {
    const { userId, otp } = req.body;
    if (!userId || !otp) {
      return res.status(400).json({ success: false, message: 'userId and OTP are required.' });
    }

    const user = await User.findById(userId).select('+otp.code +otp.expiresAt +otp.attempts +password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.isVerified) return res.status(400).json({ success: false, message: 'Email already verified.' });

    const result = user.verifyOTP(otp.toString().trim());
    if (!result.valid) {
      await user.save(); // Save attempt count
      return res.status(400).json({ success: false, message: result.reason });
    }

    user.isVerified = true;
    user.status = 'active';
    user.isApprovedByAdmin = user.role === 'admin';
    user.clearOTP();
    const { accessToken, refreshToken } = await issueTokens(user, res);

    // Send welcome email
    try {
      if (user.role === 'seeker') await emailService.sendWelcomeSeeker(user.email, user.name);
      if (user.role === 'employer') await emailService.sendWelcomeEmployer(user.email, user.name);
    } catch (e) { console.error('Welcome email failed:', e.message); }

    res.json({
      success: true,
      message: 'Email verified successfully! Welcome to Total Facility Solutions.',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        avatar: user.avatar,
        status: user.status,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/auth/resend-otp ────────────────────────────────────
router.post('/resend-otp', async (req, res, next) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId).select('+otp');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.isVerified) return res.status(400).json({ success: false, message: 'Email already verified.' });

    const otp = user.generateOTP();
    await user.save();

    try {
      await emailService.resendOTP(user.email, user.name, otp);
    } catch (e) { console.error('OTP resend email failed:', e.message); }

    res.json({
      success: true,
      message: 'New verification code sent to your email.',
      ...(process.env.NODE_ENV === 'development' && { devOtp: otp }),
    });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────
router.post('/login', loginValidation, async (req, res, next) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError !== null) return;

    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password +otp');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isVerified) {
      // Resend OTP
      const otp = user.generateOTP();
      await user.save();
      try { await emailService.sendOTP(user.email, user.name, otp); } catch (e) {}
      return res.status(403).json({
        success: false,
        message: 'Email not verified. A new code has been sent to your email.',
        code: 'EMAIL_NOT_VERIFIED',
        userId: user._id,
        ...(process.env.NODE_ENV === 'development' && { devOtp: otp }),
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Account suspended. Please contact admin.' });
    }

    const { accessToken, refreshToken } = await issueTokens(user, res);

    res.json({
      success: true,
      message: 'Login successful.',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        avatar: user.avatar,
        status: user.status,
        phone: user.phone,
        unreadNotifications: user.unreadNotifications,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/auth/refresh ───────────────────────────────────────
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ success: false, message: 'Refresh token required.' });

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) return res.status(401).json({ success: false, message: 'Invalid refresh token.' });

    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ success: false, message: 'User not found.' });

    const tokenExists = user.refreshTokens.some(t => t.token === refreshToken && new Date() < t.expiresAt);
    if (!tokenExists) return res.status(401).json({ success: false, message: 'Refresh token expired or revoked.' });

    // Rotate refresh token
    user.refreshTokens = user.refreshTokens.filter(t => t.token !== refreshToken);
    const { accessToken, refreshToken: newRefreshToken } = await issueTokens(user, res);

    res.json({ success: true, accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/auth/logout ────────────────────────────────────────
router.post('/logout', protect, async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      req.user.refreshTokens = req.user.refreshTokens.filter(t => t.token !== refreshToken);
    } else {
      req.user.refreshTokens = []; // Logout all devices
    }
    await req.user.save();
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/auth/forgot-password ──────────────────────────────
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    // Always return success to prevent email enumeration
    if (!user) return res.json({ success: true, message: 'If this email exists, a reset link has been sent.' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}&id=${user._id}`;
    try { await emailService.sendPasswordReset(user.email, user.name, resetLink); } catch (e) {}

    res.json({ success: true, message: 'If this email exists, a reset link has been sent.' });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/auth/reset-password ───────────────────────────────
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, userId, password } = req.body;
    if (!token || !userId || !password) {
      return res.status(400).json({ success: false, message: 'All fields required.' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      _id: userId,
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshTokens = []; // Invalidate all sessions
    await user.save();

    res.json({ success: true, message: 'Password reset successful. Please log in.' });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────
router.get('/me', protect, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      isVerified: req.user.isVerified,
      avatar: req.user.avatar,
      status: req.user.status,
      phone: req.user.phone,
      seekerProfile: req.user.seekerProfile,
      employerProfile: req.user.employerProfile,
      notifications: req.user.notifications,
      unreadNotifications: req.user.unreadNotifications,
    },
  });
});

module.exports = router;
