const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const claimSchema = new mongoose.Schema({
  claimNumber: { type: String, unique: true },
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  policyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Policy', required: true },

  // Trigger Details
  triggerType: {
    type: String,
    enum: ['extreme_heat', 'heavy_rain', 'flood', 'severe_pollution', 'curfew', 'strike', 'platform_outage', 'cyclone', 'hailstorm', 'dense_fog', 'cold_wave'],
    required: true
  },
  triggerDescription: { type: String },
  triggerData: {
    weatherCondition: String,
    temperature: Number,
    rainfall: Number,
    windSpeed: Number,
    aqiIndex: Number,
    floodLevel: String,
    sourceApi: String,
    rawData: mongoose.Schema.Types.Mixed
  },

  // Disruption Period
  disruptionStartDate: { type: Date, required: true },
  disruptionEndDate: { type: Date },
  affectedHours: { type: Number },
  affectedDays: { type: Number },

  // Claim Amount
  estimatedLoss: { type: Number },
  claimAmount: { type: Number },
  approvedAmount: { type: Number, default: 0 },

  // Location
  location: {
    city: String,
    zone: String,
    pincode: String,
    latitude: Number,
    longitude: Number
  },

  // Status
  status: {
    type: String,
    enum: ['auto_triggered', 'submitted', 'under_review', 'approved', 'rejected', 'paid', 'fraud_flagged'],
    default: 'submitted'
  },
  isAutoTriggered: { type: Boolean, default: false },

  // Fraud Detection
  fraudScore: { type: Number, default: 0, min: 0, max: 1 },
  fraudFlags: [{
    flag: String,
    score: Number,
    description: String,
    detectedAt: Date
  }],
  isFraudulent: { type: Boolean, default: false },
  fraudReviewNote: String,

  // Evidence
  supportingDocuments: [{
    type: { type: String },
    url: String,
    uploadedAt: Date
  }],

  // Review
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
  reviewedAt: { type: Date },
  rejectionReason: String,
  reviewNotes: String,

  // Payout
  payoutMethod: { type: String, enum: ['upi', 'bank_transfer', 'wallet'] },
  payoutTransactionId: String,
  paidAt: { type: Date },
  payoutStatus: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },

  // Timeline
  submittedAt: { type: Date, default: Date.now },
  processedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

claimSchema.pre('save', function(next) {
  if (!this.claimNumber) {
    const uid = uuidv4().split('-')[0].toUpperCase();
    this.claimNumber = `CLM-${uid}`;
  }
  next();
});

claimSchema.index({ workerId: 1, status: 1 });
claimSchema.index({ policyId: 1 });
claimSchema.index({ triggerType: 1, disruptionStartDate: 1 });
claimSchema.index({ fraudScore: -1 });
claimSchema.index({ 'location.city': 1, disruptionStartDate: -1 });

module.exports = mongoose.model('Claim', claimSchema);
