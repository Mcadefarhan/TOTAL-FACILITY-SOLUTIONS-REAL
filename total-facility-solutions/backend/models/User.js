const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    // ─── Core Fields ────────────────────────────────────────────
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,10})+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never returned in queries by default
    },
    role: {
      type: String,
      enum: ['seeker', 'employer', 'admin'],
      default: 'seeker',
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please enter a valid Indian mobile number'],
    },
    avatar: {
      type: String,
      default: null,
    },
    avatarPublicId: {
      type: String,
      default: null,
    },

    // ─── Email Verification ──────────────────────────────────────
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      code: { type: String, select: false },
      expiresAt: { type: Date, select: false },
      attempts: { type: Number, default: 0, select: false },
    },

    // ─── Account Status ──────────────────────────────────────────
    status: {
      type: String,
      enum: ['active', 'suspended', 'pending'],
      default: 'pending',
    },
    isApprovedByAdmin: {
      type: Boolean,
      default: false,
    },

    // ─── Auth Tokens ─────────────────────────────────────────────
    refreshTokens: [{
      token: String,
      createdAt: { type: Date, default: Date.now },
      expiresAt: Date,
    }],
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    lastLogin: Date,

    // ─── Profile (Seeker) ────────────────────────────────────────
    seekerProfile: {
      fatherName: String,
      aadhaar: { type: String, select: false }, // sensitive
      address: String,
      city: String,
      state: String,
      pincode: String,
      qualification: String,
      school: String,
      skills: [{ type: String }],
      primarySkill: String,
      experience: String, // "Fresher" | "1 Year" | "2 Years" etc.
      previousWork: String,
      lastCompany: String,
      preferredShift: { type: String, enum: ['Day', 'Night', 'Both'], default: 'Day' },
      workTiming: String,
      willingToRelocate: { type: Boolean, default: false },
      expectedSalary: Number,
      documentsSubmitted: [String],
      applicationStatus: {
        type: String,
        enum: ['draft', 'submitted', 'under_review', 'shortlisted', 'placed', 'rejected'],
        default: 'draft',
      },
      submittedAt: Date,
      placedAt: Date,
      adminNotes: String,
    },

    // ─── Profile (Employer) ──────────────────────────────────────
    employerProfile: {
      businessName: String,
      businessType: String,
      gstNumber: String,
      businessAddress: String,
      city: String,
      state: String,
      website: String,
      description: String,
      verificationStatus: {
        type: String,
        enum: ['unverified', 'pending', 'verified'],
        default: 'unverified',
      },
    },

    // ─── Notifications ───────────────────────────────────────────
    notifications: [{
      title: String,
      message: String,
      type: { type: String, enum: ['info', 'success', 'warning', 'error'] },
      read: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now },
    }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ─────────────────────────────────────────────────────
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ 'seekerProfile.applicationStatus': 1 });
userSchema.index({ 'seekerProfile.primarySkill': 1 });
userSchema.index({ createdAt: -1 });

// ─── Pre-save: Hash Password ──────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ─── Methods ─────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = {
    code: otp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    attempts: 0,
  };
  return otp;
};

userSchema.methods.verifyOTP = function (inputOtp) {
  if (!this.otp?.code) return { valid: false, reason: 'No OTP found' };
  if (this.otp.attempts >= 5) return { valid: false, reason: 'Too many attempts' };
  if (new Date() > this.otp.expiresAt) return { valid: false, reason: 'OTP expired' };
  if (this.otp.code !== inputOtp) {
    this.otp.attempts += 1;
    return { valid: false, reason: 'Invalid OTP' };
  }
  return { valid: true };
};

userSchema.methods.clearOTP = function () {
  this.otp = undefined;
};

userSchema.methods.addNotification = function (title, message, type = 'info') {
  this.notifications.unshift({ title, message, type });
  if (this.notifications.length > 50) {
    this.notifications = this.notifications.slice(0, 50);
  }
};

// ─── Virtuals ─────────────────────────────────────────────────────
userSchema.virtual('unreadNotifications').get(function () {
  return (this.notifications || []).filter(n => !n.read).length;
});

module.exports = mongoose.model('User', userSchema);
