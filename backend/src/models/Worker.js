const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const workerSchema = new mongoose.Schema({
  // Basic Info
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  password: { type: String, required: true, select: false },
  avatar: { type: String, default: null },

  // KYC & Verification
  aadhaarNumber: { type: String, trim: true },
  panNumber: { type: String, trim: true },
  bankAccountNumber: { type: String },
  ifscCode: { type: String },
  upiId: { type: String },
  isKycVerified: { type: Boolean, default: false },
  kycDocuments: [{
    type: { type: String, enum: ['aadhaar', 'pan', 'bank_passbook', 'selfie'] },
    url: String,
    uploadedAt: Date,
    verified: { type: Boolean, default: false }
  }],

  // Platform Info
  platform: {
    type: String,
    required: true,
    enum: ['zomato', 'swiggy', 'amazon', 'flipkart', 'zepto', 'blinkit', 'dunzo', 'other']
  },
  deliverySegment: {
    type: String,
    required: true,
    enum: ['food', 'ecommerce', 'grocery_qcommerce']
  },
  platformWorkerId: { type: String },
  vehicleType: {
    type: String,
    enum: ['bicycle', 'motorcycle', 'scooter', 'electric_scooter', 'car'],
    required: true
  },
  city: { type: String, required: true },
  zone: { type: String },
  pincode: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },

  // Earnings Profile (for risk/premium calculation)
  averageWeeklyEarnings: { type: Number, default: 3500 },
  averageDailyHours: { type: Number, default: 8 },
  workingDaysPerWeek: { type: Number, default: 6 },
  experienceMonths: { type: Number, default: 6 },

  // Risk Profile (AI-generated)
  riskScore: { type: Number, default: 0.5, min: 0, max: 1 },
  riskCategory: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  riskFactors: [{ factor: String, weight: Number, description: String }],
  lastRiskAssessment: { type: Date },

  // Subscription/Plan
  activePolicyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Policy' },
  isActive: { type: Boolean, default: true },

  // Gamification / Engagement
  loyaltyPoints: { type: Number, default: 0 },
  streakWeeks: { type: Number, default: 0 },
  totalClaimsCount: { type: Number, default: 0 },
  fraudFlags: { type: Number, default: 0 },

  // FCM Token for push notifications
  fcmToken: { type: String },

  // Referral
  referralCode: { type: String, unique: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
  referralCount: { type: Number, default: 0 },

  role: { type: String, enum: ['worker', 'admin'], default: 'worker' },
  lastLogin: { type: Date },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
workerSchema.index({ phone: 1 });
workerSchema.index({ city: 1, platform: 1 });
workerSchema.index({ riskCategory: 1 });
workerSchema.index({ referralCode: 1 });

// Virtual: policies
workerSchema.virtual('policies', {
  ref: 'Policy',
  localField: '_id',
  foreignField: 'workerId'
});

// Hash password before save
workerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Generate referral code
workerSchema.pre('save', function(next) {
  if (!this.referralCode) {
    this.referralCode = 'GS' + Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});

// Compare password
workerSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Check if account is locked
workerSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

module.exports = mongoose.model('Worker', workerSchema);
