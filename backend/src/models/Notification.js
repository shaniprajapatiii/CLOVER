const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['claim_triggered', 'claim_approved', 'claim_rejected', 'claim_paid', 'policy_created', 'policy_expiring', 'policy_renewed', 'weather_alert', 'fraud_alert', 'payment_due', 'general'],
    required: true
  },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  data: mongoose.Schema.Types.Mixed,
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
}, { timestamps: true });

notificationSchema.index({ workerId: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
