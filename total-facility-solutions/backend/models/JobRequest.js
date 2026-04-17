const mongoose = require('mongoose');

const jobRequestSchema = new mongoose.Schema(
  {
    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // ─── Job Details ───────────────────────────────────────────
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    staffType: {
      type: String,
      required: [true, 'Staff type is required'],
      enum: [
        'Housekeeping', 'Security Guard', 'Office Boy', 'Salesman',
        'Receptionist', 'Driver', 'Cook', 'Helper', 'Supervisor',
        'Peon', 'Watchman', 'Sweeper', 'Other'
      ],
    },
    numberOfStaff: {
      type: Number,
      required: [true, 'Number of staff is required'],
      min: [1, 'At least 1 staff required'],
      max: [500, 'Cannot request more than 500 staff at once'],
    },
    description: {
      type: String,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },

    // ─── Requirements ──────────────────────────────────────────
    salaryMin: { type: Number, min: 0 },
    salaryMax: { type: Number },
    shift: {
      type: String,
      enum: ['Day', 'Night', 'Both', 'Rotating'],
      default: 'Day',
    },
    workTiming: String,
    contractDuration: String,
    location: String,
    city: String,
    state: String,
    specialRequirements: String,
    genderPreference: {
      type: String,
      enum: ['Any', 'Male', 'Female'],
      default: 'Any',
    },
    minExperience: String,
    qualificationRequired: String,

    // ─── Status & Workflow ────────────────────────────────────
    status: {
      type: String,
      enum: ['pending', 'under_review', 'in_progress', 'fulfilled', 'cancelled', 'rejected'],
      default: 'pending',
    },
    adminNotes: String,
    rejectionReason: String,

    // ─── Matched Seekers ──────────────────────────────────────
    matchedSeekers: [{
      seeker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      matchedAt: { type: Date, default: Date.now },
      matchStatus: {
        type: String,
        enum: ['suggested', 'contacted', 'hired', 'rejected'],
        default: 'suggested',
      },
      adminNote: String,
    }],

    // ─── Timeline ─────────────────────────────────────────────
    reviewedAt: Date,
    fulfilledAt: Date,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

jobRequestSchema.index({ employer: 1 });
jobRequestSchema.index({ status: 1 });
jobRequestSchema.index({ staffType: 1 });
jobRequestSchema.index({ city: 1 });
jobRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('JobRequest', jobRequestSchema);
