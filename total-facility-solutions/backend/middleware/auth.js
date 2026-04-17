const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');

// ─── Protect: Verify JWT ──────────────────────────────────────────
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please log in again.',
        code: 'TOKEN_EXPIRED',
      });
    }

    const user = await User.findById(decoded.id).select('+otp');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Token is invalid.',
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact admin.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

// ─── Verified: Email must be verified ────────────────────────────
const requireVerified = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email address before accessing this resource.',
      code: 'EMAIL_NOT_VERIFIED',
    });
  }
  next();
};

// ─── Role-Based Authorization ─────────────────────────────────────
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This resource requires role: ${roles.join(' or ')}.`,
      });
    }
    next();
  };
};

// ─── Shorthand Role Guards ────────────────────────────────────────
const adminOnly = authorize('admin');
const seekerOnly = authorize('seeker');
const employerOnly = authorize('employer');
const seekerOrAdmin = authorize('seeker', 'admin');
const employerOrAdmin = authorize('employer', 'admin');
const notAdmin = authorize('seeker', 'employer');

// ─── Optional Auth (doesn't fail if no token) ────────────────────
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = verifyAccessToken(token);
      if (decoded) {
        const user = await User.findById(decoded.id);
        if (user) req.user = user;
      }
    }
    next();
  } catch {
    next();
  }
};

module.exports = {
  protect,
  requireVerified,
  authorize,
  adminOnly,
  seekerOnly,
  employerOnly,
  seekerOrAdmin,
  employerOrAdmin,
  notAdmin,
  optionalAuth,
};
