const Delivery = require('../models/Delivery');
const Order = require('../models/Order');
const ActivityLog = require('../models/ActivityLog');
const Worker = require('../models/Worker');
const { v4: uuidv4 } = require('uuid');

// ==================== Get Delivery Details ====================
exports.getDeliveryDetails = async (req, res) => {
  try {
    const { deliveryId } = req.params;

    const delivery = await Delivery.findById(deliveryId)
      .populate('workerId', 'name phone avatar deliveryPartnerId')
      .populate('orderId', 'orderId status totalAmount items customerName customerPhone')
      .populate('activityLogIds', 'activityType location timestamp deviceInfo');

    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery not found' });
    }

    res.status(200).json({
      success: true,
      data: delivery
    });
  } catch (error) {
    console.error('Error fetching delivery details:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== Get Worker Active Deliveries ====================
exports.getWorkerActiveDeliveries = async (req, res) => {
  try {
    const { workerId } = req.params;
    const { status } = req.query;

    let query = { workerId };
    if (status) {
      query.status = status;
    } else {
      query.status = { $in: ['assigned', 'accepted', 'picked_up', 'on_way'] };
    }

    const deliveries = await Delivery.find(query)
      .populate('orderId', 'orderId status totalAmount items dropAddress estimatedDeliveryTime')
      .sort({ assignedAt: -1 });

    res.status(200).json({
      success: true,
      count: deliveries.length,
      data: deliveries
    });
  } catch (error) {
    console.error('Error fetching worker deliveries:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== Update Delivery Status ====================
exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { status, location, notes } = req.body;

    const validStatuses = ['accepted', 'picked_up', 'on_way', 'arrived', 'completed', 'cancelled', 'failed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery not found' });
    }

    // Update delivery status
    delivery.status = status;

    // Update timestamps
    if (status === 'accepted') delivery.acceptedAt = new Date();
    if (status === 'picked_up') delivery.pickedUpAt = new Date();
    if (status === 'completed') {
      delivery.deliveredAt = new Date();
      if (delivery.assignedAt) {
        delivery.actualTime = Math.round((delivery.deliveredAt - delivery.assignedAt) / 60000); // minutes
      }
    }
    if (status === 'cancelled') delivery.cancelledAt = new Date();

    // Update location in route path if provided
    if (location) {
      delivery.currentLocation = {
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: new Date(),
        accuracy: location.accuracy
      };

      delivery.routePath.push({
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: new Date(),
        speed: location.speed,
        batteryLevel: location.batteryLevel
      });
    }

    if (notes) delivery.notes = notes;

    await delivery.save();

    // Also update corresponding Order
    await Order.findByIdAndUpdate(delivery.orderId, {
      status: status === 'completed' ? 'delivered' : status
    });

    res.status(200).json({
      success: true,
      message: `Delivery status updated to ${status}`,
      data: delivery
    });
  } catch (error) {
    console.error('Error updating delivery status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== Submit Delivery Proof ====================
exports.submitDeliveryProof = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { photo, signature, otp, location } = req.body;

    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery not found' });
    }

    delivery.deliveryProof = {
      photo,
      signature,
      otp,
      timestamp: new Date(),
      location
    };

    delivery.status = 'completed';
    delivery.deliveredAt = new Date();

    // Calculate actual time
    if (delivery.assignedAt) {
      delivery.actualTime = Math.round((delivery.deliveredAt - delivery.assignedAt) / 60000); // minutes
    }

    await delivery.save();

    res.status(200).json({
      success: true,
      message: 'Delivery proof submitted',
      data: delivery
    });
  } catch (error) {
    console.error('Error submitting delivery proof:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== Get Delivery Route & Analytics ====================
exports.getDeliveryAnalytics = async (req, res) => {
  try {
    const { deliveryId } = req.params;

    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery not found' });
    }

    // Calculate metrics from route path
    const routePath = delivery.routePath;
    
    let maxSpeed = 0;
    let totalMovingTime = 0;
    let stationaryTime = 0;

    for (let i = 0; i < routePath.length; i++) {
      if (routePath[i].speed) {
        maxSpeed = Math.max(maxSpeed, routePath[i].speed);
        totalMovingTime += 1; // Each point is ~1 minute
      } else {
        stationaryTime += 1;
      }
    }

    const averageSpeed = delivery.metrics?.averageSpeed || (delivery.actualDistance && delivery.actualTime ? (delivery.actualDistance / delivery.actualTime * 60).toFixed(2) : 0);

    const analytics = {
      deliveryDuration: delivery.actualTime,
      estimatedVsActual: delivery.estimatedTime && delivery.actualTime ? ((delivery.actualTime - delivery.estimatedTime) / delivery.estimatedTime * 100).toFixed(2) : 'N/A',
      distance: delivery.actualDistance || delivery.estimatedDistance,
      averageSpeed: parseFloat(averageSpeed),
      maxSpeed,
      totalStops: routePath.filter(p => !p.speed || p.speed === 0).length,
      timeStationary: stationaryTime,
      timeMoving: totalMovingTime,
      routeEfficiency: ((delivery.actualDistance || 0) / (delivery.estimatedDistance || 1) * 100).toFixed(2),
      batteryDropped: delivery.routePath.length > 0 ? 
        ((delivery.routePath[0]?.batteryLevel || 100) - (delivery.routePath[delivery.routePath.length - 1]?.batteryLevel || 0)) : 0
    };

    res.status(200).json({
      success: true,
      data: {
        delivery,
        analytics,
        routePath: delivery.routePath.slice(-20) // Last 20 location points for map
      }
    });
  } catch (error) {
    console.error('Error fetching delivery analytics:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== Rate Delivery ====================
exports.rateDelivery = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { rating, feedback } = req.body;

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const delivery = await Delivery.findByIdAndUpdate(
      deliveryId,
      { customerRating: rating, customerFeedback: feedback },
      { new: true }
    );

    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Rating submitted',
      data: delivery
    });
  } catch (error) {
    console.error('Error rating delivery:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== Get Worker Delivery Statistics ====================
exports.getWorkerDeliveryStats = async (req, res) => {
  try {
    const { workerId } = req.params;
    const { startDate, endDate } = req.query;

    let query = { workerId };
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const deliveries = await Delivery.find(query)
      .populate('orderId', 'totalAmount');

    const completedDeliveries = deliveries.filter(d => d.status === 'completed');
    const ratings = completedDeliveries.filter(d => d.customerRating).map(d => d.customerRating);

    const stats = {
      totalDeliveries: deliveries.length,
      completedDeliveries: completedDeliveries.length,
      cancelledDeliveries: deliveries.filter(d => d.status === 'cancelled').length,
      failedDeliveries: deliveries.filter(d => d.status === 'failed').length,
      totalEarnings: completedDeliveries.reduce((sum, d) => {
        return sum + (d.orderId?.totalAmount || 0);
      }, 0),
      averageDeliveryTime: completedDeliveries.length > 0 ? 
        Math.round(completedDeliveries.reduce((sum, d) => sum + (d.actualTime || 0), 0) / completedDeliveries.length) : 0,
      averageRating: ratings.length > 0 ? 
        (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2) : 'N/A',
      totalDistance: deliveries.reduce((sum, d) => sum + (d.actualDistance || 0), 0),
      successRate: Math.round((completedDeliveries.length / Math.max(1, deliveries.length)) * 100),
      fraudDetections: deliveries.filter(d => d.fraudDetected).length
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching delivery stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== Cancel Delivery ====================
exports.cancelDelivery = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { reason } = req.body;

    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery not found' });
    }

    if (['completed', 'failed'].includes(delivery.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel completed delivery' });
    }

    delivery.status = 'cancelled';
    delivery.cancellationReason = reason;
    delivery.cancelledAt = new Date();

    await delivery.save();

    res.status(200).json({
      success: true,
      message: 'Delivery cancelled',
      data: delivery
    });
  } catch (error) {
    console.error('Error cancelling delivery:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
