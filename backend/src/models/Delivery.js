const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  // Delivery Identification
  deliveryId: { type: String, required: true, unique: true, trim: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  
  // Delivery Partner
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  deliveryPartnerId: { type: String, required: true }, // CLOVER unique ID
  
  // Delivery Status
  status: {
    type: String,
    enum: ['assigned', 'accepted', 'picked_up', 'on_way', 'arrived', 'completed', 'cancelled', 'failed'],
    default: 'assigned',
    required: true
  },
  
  // Timing
  assignedAt: { type: Date, default: Date.now },
  acceptedAt: Date,
  pickedUpAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  
  // Route & Distance
  pickupAddress: { type: String, required: true },
  dropAddress: { type: String, required: true },
  estimatedDistance: { type: Number }, // km
  actualDistance: { type: Number }, // km (tracked)
  estimatedTime: { type: Number }, // minutes
  actualTime: { type: Number }, // minutes
  
  // Current Location Tracking
  currentLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
    timestamp: { type: Date, default: Date.now },
    accuracy: Number
  },
  
  // Route Path (sequence of location points)
  routePath: [{
    latitude: Number,
    longitude: Number,
    timestamp: Date,
    speed: Number,
    batteryLevel: Number
  }],
  
  // Delivery Metrics
  metrics: {
    averageSpeed: Number, // km/h
    maxSpeed: Number,
    totalStops: Number, // number of stops
    timeStationary: Number, // seconds stopped
    deviationFromOptimalRoute: Number // %
  },
  
  // Delivery Proof
  deliveryProof: {
    photo: String,
    signature: String,
    otp: String, // OTP verified
    timestamp: Date,
    location: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Customer Interaction
  customerRating: { type: Number, min: 1, max: 5 },
  customerFeedback: String,
  
  // CLOVER Activity Link
  activityLogIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ActivityLog' }],
  cloverActivityId: String, // Link to CLOVER claim activity
  
  // Risk & Fraud Detection
  fraudDetected: { type: Boolean, default: false },
  fraudReasons: [String], // e.g., ['gps_jump', 'unusually_fast']
  
  // Weather Context at Delivery Time
  weatherCondition: {
    temperature: Number,
    rainfall: Number,
    aqi: Number,
    windSpeed: Number
  },
  
  // Cancellation Reason
  cancellationReason: {
    type: String,
    enum: ['customer_request', 'delivery_partner_cancellation', 'system_error', 'order_unavailable'],
  },
  
  notes: String,
}, { timestamps: true });

// Indexes
deliverySchema.index({ workerId: 1, status: 1, createdAt: -1 });
deliverySchema.index({ deliveryPartnerId: 1, createdAt: -1 });
deliverySchema.index({ orderId: 1 });
deliverySchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Delivery', deliverySchema);
