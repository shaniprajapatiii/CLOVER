const ActivityLog = require('../models/ActivityLog');
const Order = require('../models/Order');
const Delivery = require('../models/Delivery');
const Worker = require('../models/Worker');

// ==================== Log Activity (Real-time) ====================
exports.logActivity = async (req, res) => {
  try {
    const { workerId, deliveryPartnerId, orderId, activityType, location, deviceInfo, networkInfo, orderDetails } = req.body;

    // Validate required fields
    if (!workerId || !activityType || !location) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Get order details if order is being tracked
    let weatherSnapshot = {};
    if (orderId) {
      const order = await Order.findById(orderId);
      if (order) {
        weatherSnapshot = order.weatherCondition || {};
      }
    }

    // GPS Verification (anti-fraud)
    const gpsVerification = {
      isValid: Math.abs(location.latitude) <= 90 && Math.abs(location.longitude) <= 180,
      speedCheck: (location.speed || 0) <= 120, // Max realistic speed ~120 km/h
      speedAnomaly: (location.speed || 0) > 100 // Speeds > 100 km/h are anomalies for delivery
    };

    const activityLog = new ActivityLog({
      workerId,
      deliveryPartnerId: deliveryPartnerId || `DP-${workerId}`,
      orderId,
      activityType,
      location,
      deviceInfo,
      networkInfo,
      orderDetails,
      weatherSnapshot,
      gpsVerification,
      sentToCLOVER: false // Will be synced to CLOVER
    });

    await activityLog.save();

    // Also update Order's activity log if order exists
    if (orderId) {
      await Order.findByIdAndUpdate(
        orderId,
        {
          $push: {
            activityLog: {
              timestamp: new Date(),
              status: req.body.status,
              location: location,
              batteryLevel: deviceInfo?.batteryLevel,
              connectionType: networkInfo?.type,
              isOnline: true
            }
          }
        },
        { new: true }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Activity logged successfully',
      data: activityLog
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== Get Worker Activity Timeline ====================
exports.getWorkerActivityTimeline = async (req, res) => {
  try {
    const { workerId } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    const activities = await ActivityLog.find({ workerId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const totalCount = await ActivityLog.countDocuments({ workerId });

    res.status(200).json({
      success: true,
      data: activities,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: totalCount > (parseInt(skip) + parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching activity timeline:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== Get Order Delivery Progress ====================
exports.getDeliveryProgress = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const activities = await ActivityLog.find({ orderId })
      .sort({ createdAt: 1 });

    // Build real-time tracking path
    const trackingPath = activities.map(activity => ({
      timestamp: activity.createdAt,
      location: activity.location,
      activityType: activity.activityType,
      speed: activity.location.speed,
      batteryLevel: activity.deviceInfo?.batteryLevel
    }));

    res.status(200).json({
      success: true,
      data: {
        order,
        trackingPath,
        totalActivities: activities.length,
        lastUpdate: activities[activities.length - 1]?.createdAt || order.acceptedAt
      }
    });
  } catch (error) {
    console.error('Error fetching delivery progress:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== Sync Activity to CLOVER ====================
exports.syncActivityToCLOVER = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = { sentToCLOVER: false };
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const unsyncedActivities = await ActivityLog.find(query)
      .populate('workerId', 'name phone deliveryPartnerId')
      .populate('orderId', 'orderId status totalAmount');

    // Mark as synced
    await ActivityLog.updateMany(query, {
      sentToCLOVER: true,
      cloverSyncedAt: new Date()
    });

    res.status(200).json({
      success: true,
      message: `${unsyncedActivities.length} activities synced to CLOVER`,
      data: unsyncedActivities,
      syncedAt: new Date()
    });
  } catch (error) {
    console.error('Error syncing to CLOVER:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== Get Worker Stats for CLOVER Claims ====================
exports.getWorkerActivityStats = async (req, res) => {
  try {
    const { workerId, deliveryPartnerId, startDate, endDate } = req.query;

    let query = {};
    if (workerId) query.workerId = workerId;
    if (deliveryPartnerId) query.deliveryPartnerId = deliveryPartnerId;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const activities = await ActivityLog.find(query);
    const deliveries = await Delivery.find({
      ...(workerId && { workerId }),
      ...(deliveryPartnerId && { deliveryPartnerId }),
      status: 'completed',
      ...(startDate || endDate) && {
        createdAt: {
          ...(startDate && { $gte: new Date(startDate) }),
          ...(endDate && { $lte: new Date(endDate) })
        }
      }
    });

    // Calculate stats
    const stats = {
      totalActivities: activities.length,
      activeHours: activities.filter(a => a.activityType === 'online').length,
      onlineTime: activities.filter(a => a.activityType === 'online').length * 5, // 5 min intervals = ~hrs
      totalDeliveries: deliveries.length,
      totalDistance: deliveries.reduce((sum, d) => sum + (d.actualDistance || 0), 0),
      totalEarnings: deliveries.reduce((sum, d) => {
        const order = d.orderId;
        return sum + (order?.totalAmount || 0);
      }, 0),
      riskFlags: activities.reduce((sum, a) => sum + (a.riskFlags?.length || 0), 0),
      fraudDetections: deliveries.filter(d => d.fraudDetected).length
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== Detect Activity Anomalies ====================
exports.detectAnomalies = async (req, res) => {
  try {
    const { workerId, orderId } = req.params;

    let query = {};
    if (workerId) query.workerId = workerId;
    if (orderId) query.orderId = orderId;

    const activities = await ActivityLog.find(query).sort({ createdAt: 1 });

    const anomalies = [];

    for (let i = 0; i < activities.length - 1; i++) {
      const current = activities[i];
      const next = activities[i + 1];

      // Check speed anomaly
      if (current.location.speed && current.location.speed > 100) {
        anomalies.push({
          type: 'speed_anomaly',
          activity: current._id,
          timestamp: current.createdAt,
          value: current.location.speed,
          description: `Unusual speed: ${current.location.speed} km/h`
        });
      }

      // Check GPS jump (large distance in short time)
      if (next.location) {
        const timeDiff = (next.createdAt - current.createdAt) / 1000 / 60; // minutes
        const latDiff = Math.abs(next.location.latitude - current.location.latitude);
        const lonDiff = Math.abs(next.location.longitude - current.location.longitude);
        const distance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff) * 111; // km approximation

        if (distance > 5 && timeDiff < 1) { // 5 km in < 1 minute
          anomalies.push({
            type: 'gps_jump',
            activity: current._id,
            timestamp: current.createdAt,
            value: distance,
            description: `GPS jump: ${distance.toFixed(2)} km in ${timeDiff.toFixed(1)} minutes`
          });
        }
      }

      // Check low battery
      if (current.deviceInfo?.batteryLevel && current.deviceInfo.batteryLevel < 10) {
        anomalies.push({
          type: 'low_battery',
          activity: current._id,
          timestamp: current.createdAt,
          value: current.deviceInfo.batteryLevel,
          description: `Low battery: ${current.deviceInfo.batteryLevel}%`
        });
      }

      // Check no signal
      if (!current.networkInfo?.isConnected) {
        anomalies.push({
          type: 'no_signal',
          activity: current._id,
          timestamp: current.createdAt,
          description: 'No network connection'
        });
      }
    }

    res.status(200).json({
      success: true,
      anomaliesFound: anomalies.length,
      data: anomalies
    });
  } catch (error) {
    console.error('Error detecting anomalies:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
