const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  // Worker & Order Reference
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  deliveryPartnerId: { type: String, required: true }, // CLOVER delivery partner ID
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  orderNumber: String,
  
  // Activity Type
  activityType: {
    type: String,
    enum: ['online', 'offline', 'order_accepted', 'order_picked', 'order_delivered', 'location_update', 'order_cancelled', 'pause'],
    required: true
  },
  
  // Location & Movement
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    accuracy: Number, // meters
    altitude: Number,
    heading: Number, // direction in degrees
    speed: Number // km/h
  },
  
  // Device Context (shared with CLOVER for claim validation)
  deviceInfo: {
    batteryLevel: { type: Number, min: 0, max: 100 },
    isCharging: Boolean,
    screenOn: Boolean
  },
  
  // Network Status (shared with CLOVER for signal verification)
  networkInfo: {
    type: { type: String, enum: ['wifi', '2g', '3g', '4g', '5g', 'unknown'] },
    signalStrength: Number, // dBm
    isConnected: Boolean
  },
  
  // Time Duration
  duration: { type: Number }, // seconds for this activity
  
  // GPS Verification (anti-fraud)
  gpsVerification: {
    isValid: Boolean,
    speedCheck: Boolean, // true if speed is realistic
    jumpDistance: Number, // km since last location (for anomaly detection)
    speedAnomaly: Boolean // true if unusually fast
  },
  
  // Order Details (snapshot at time of activity)
  orderDetails: {
    fromLocation: {
      latitude: Number,
      longitude: Number
    },
    toLocation: {
      latitude: Number,
      longitude: Number
    },
    distanceFromPickup: Number,
    distanceToDroppoint: Number,
    expectedRemainingTime: Number // minutes
  },
  
  // Weather Context (for CLOVER claim correlation)
  weatherSnapshot: {
    temperature: Number,
    rainfall: Number,
    aqi: Number,
    windSpeed: Number,
    visibility: Number
  },
  
  // Activity Meta
  notes: String,
  
  // CLOVER Integration
  sentToCLOVER: { type: Boolean, default: false },
  cloverSyncedAt: Date,
  cloverActivityRecordId: String,
  
  // Backup & Risk Flags
  riskFlags: [{
    type: { type: String, enum: ['low_battery', 'no_signal', 'stationary_too_long', 'unusual_route', 'speed_anomaly'] },
    timestamp: Date,
    value: mongoose.Schema.Types.Mixed
  }],
  
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexes for efficient querying
activityLogSchema.index({ workerId: 1, createdAt: -1 });
activityLogSchema.index({ deliveryPartnerId: 1, activityType: 1, createdAt: -1 });
activityLogSchema.index({ orderId: 1, createdAt: -1 });
activityLogSchema.index({ sentToCLOVER: 1, createdAt: -1 }); // For syncing with CLOVER
activityLogSchema.index({ 'location.latitude': '2dsphere', 'location.longitude': '2dsphere' }); // Geospatial index

module.exports = mongoose.model('ActivityLog', activityLogSchema);
