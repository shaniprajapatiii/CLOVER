const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // Order Basics
  orderId: { type: String, required: true, unique: true, trim: true }, // Unique order identifier
  status: {
    type: String,
    enum: ['pending', 'accepted', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'failed'],
    default: 'pending',
    required: true
  },

  // Customer Details
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerEmail: { type: String },

  // Order Items
  items: [{
    itemId: String,
    name: String,
    quantity: Number,
    price: Number,
    specialInstructions: String
  }],
  totalAmount: { type: Number, required: true },
  estimatedDeliveryTime: { type: Number }, // minutes
  
  // Delivery Details
  pickupLocation: {
    address: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    placeName: String
  },
  dropLocation: {
    address: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    landmark: String
  },
  estimatedDistance: { type: Number }, // km
  
  // Delivery Partner Assignment
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
  deliveryPartnerId: String, // Unique CLOVER delivery partner ID
  
  // Real-time Tracking
  activityLog: [{
    timestamp: { type: Date, default: Date.now },
    status: String,
    location: {
      latitude: Number,
      longitude: Number,
      accuracy: Number
    },
    batteryLevel: Number, // For worker device
    connectionType: String, // WiFi, 4G, 5G
    isOnline: Boolean,
    distanceFromDroppoint: Number // km
  }],
  
  // Weather & Risk Context (for CLOVER claims)
  weatherCondition: {
    temperature: Number,
    rainfall: Number,
    aqi: Number,
    windSpeed: Number,
    condition: String // 'clear', 'rain', 'fog', etc.
  },
  
  // Payment
  paymentMethod: { type: String, enum: ['upi', 'card', 'wallet', 'cash'] },
  paymentStatus: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
  
  // Timing
  createdAt: { type: Date, default: Date.now },
  acceptedAt: Date,
  pickedUpAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  totalDeliveryTime: { type: Number }, // minutes
  
  // Proof of Delivery
  deliveryProof: {
    photo: String,
    signature: String,
    timestamp: Date,
    location: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Rating & Feedback
  rating: { type: Number, min: 1, max: 5 },
  feedback: String,
  
  // CLOVER Integration - Activity Tracking
  isTrackedByCLOVER: { type: Boolean, default: true }, // Activity shared with CLOVER
  cloverActivityId: String, // Link to CLOVER activity record
  
  // Fraud Detection Fields
  fraudFlags: [{
    type: { type: String, enum: ['gps_mismatch', 'unusually_long_delivery', 'multiple_cancellations', 'low_battery'] },
    timestamp: Date,
    description: String
  }],
  
  notes: String,
  cancellationReason: String
}, { timestamps: true });

// Index for faster queries
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ assignedTo: 1, status: 1 });
orderSchema.index({ deliveryPartnerId: 1, createdAt: -1 });
orderSchema.index({ 'dropLocation.latitude': 1, 'dropLocation.longitude': 1 });

module.exports = mongoose.model('Order', orderSchema);
