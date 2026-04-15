const Order = require('../models/Order');
const Worker = require('../models/Worker');
const Delivery = require('../models/Delivery');
const ActivityLog = require('../models/ActivityLog');
const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');

// Generate unique order ID
const generateOrderId = () => `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ==================== Create New Order ====================
exports.createOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      customerName,
      customerPhone,
      customerEmail,
      items,
      totalAmount,
      pickupLocation,
      dropLocation,
      estimatedDeliveryTime,
      paymentMethod,
      estimatedDistance
    } = req.body;

    const order = new Order({
      orderId: generateOrderId(),
      customerName,
      customerPhone,
      customerEmail,
      items,
      totalAmount: parseFloat(totalAmount),
      pickupLocation,
      dropLocation,
      estimatedDeliveryTime,
      paymentMethod,
      estimatedDistance,
      status: 'pending',
      isTrackedByCLOVER: true // Enable CLOVER tracking
    });

    await order.save();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== Get Available Orders ====================
exports.getAvailableOrders = async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 10 } = req.query; // maxDistance in km

    let query = { status: 'pending' };

    // If location is provided, find nearby orders
    if (latitude && longitude) {
      query['dropLocation'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: maxDistance * 1000 // Convert km to meters
        }
      };
    }

    const orders = await Order.find(query)
      .select('-activityLog') // Don't send full activity log initially
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching available orders:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== Accept Order ====================
exports.acceptOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { workerId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Order already assigned' });
    }

    const worker = await Worker.findById(workerId);
    if (!worker) return res.status(404).json({ success: false, message: 'Worker not found' });

    // Create Delivery record
    const delivery = new Delivery({
      deliveryId: `DEL-${uuidv4().substr(0, 8)}`,
      orderId,
      workerId,
      deliveryPartnerId: worker.deliveryPartnerId || `DP-${worker._id}`,
      status: 'assigned',
      pickupAddress: order.pickupLocation.address,
      dropAddress: order.dropLocation.address,
      estimatedDistance: order.estimatedDistance,
      estimatedTime: order.estimatedDeliveryTime
    });

    // Update order
    order.status = 'accepted';
    order.assignedTo = workerId;
    order.deliveryPartnerId = worker.deliveryPartnerId || `DP-${worker._id}`;
    order.acceptedAt = new Date();

    await order.save();
    await delivery.save();

    res.status(200).json({
      success: true,
      message: 'Order accepted',
      data: { order, delivery }
    });
  } catch (error) {
    console.error('Error accepting order:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== Update Order Status ====================
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, location } = req.body;

    const validStatuses = ['accepted', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'failed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.status = status;

    // Update timing based on status
    if (status === 'picked_up') order.pickedUpAt = new Date();
    if (status === 'delivered') order.deliveredAt = new Date();
    if (status === 'cancelled') order.cancelledAt = new Date();

    // Add to activity log
    if (location) {
      order.activityLog.push({
        timestamp: new Date(),
        status,
        location,
        isOnline: true
      });
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      data: order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== Log Real-time Location ====================
exports.logOrderLocation = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { latitude, longitude, batteryLevel, connectionType, accuracy } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Add activity log entry
    order.activityLog.push({
      timestamp: new Date(),
      status: order.status,
      location: { latitude, longitude, accuracy },
      batteryLevel,
      connectionType,
      isOnline: true
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Location logged',
      data: { orderId, location: { latitude, longitude } }
    });
  } catch (error) {
    console.error('Error logging location:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== Complete Delivery with Proof ====================
exports.completeDelivery = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { photo, signature, location } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Record delivery proof
    order.deliveryProof = {
      photo,
      signature,
      timestamp: new Date(),
      location
    };

    order.status = 'delivered';
    order.deliveredAt = new Date();
    order.paymentStatus = 'completed';

    // Calculate delivery time
    if (order.acceptedAt) {
      order.totalDeliveryTime = Math.round((new Date() - order.acceptedAt) / 60000); // minutes
    }

    await order.save();

    // Update Delivery record
    await Delivery.findOneAndUpdate(
      { orderId },
      { status: 'completed', deliveredAt: new Date() },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Delivery completed',
      data: order
    });
  } catch (error) {
    console.error('Error completing delivery:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== Get Order Details ====================
exports.getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate('assignedTo', 'name phone avatar deliveryPartnerId');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== Get Orders by Worker ====================
exports.getWorkerOrders = async (req, res) => {
  try {
    const { workerId } = req.params;
    const { status } = req.query;

    let query = { assignedTo: workerId };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .select('-activityLog')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching worker orders:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== Cancel Order ====================
exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (['delivered', 'completed'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel completed order' });
    }

    order.status = 'cancelled';
    order.cancellationReason = reason;
    order.cancelledAt = new Date();

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order cancelled',
      data: order
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== Get Order Analytics ====================
exports.getOrderAnalytics = async (req, res) => {
  try {
    const { workerId, startDate, endDate } = req.query;

    let query = {};
    if (workerId) query.assignedTo = workerId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(query);

    const analytics = {
      totalOrders: orders.length,
      completedOrders: orders.filter(o => o.status === 'delivered').length,
      cancelledOrders: orders.filter(o => o.status === 'cancelled').length,
      totalEarnings: orders
        .filter(o => o.status === 'delivered')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      averageDeliveryTime: Math.round(
        orders
          .filter(o => o.totalDeliveryTime)
          .reduce((sum, o) => sum + o.totalDeliveryTime, 0) / Math.max(1, orders.length)
      ),
      successRate: Math.round((orders.filter(o => o.status === 'delivered').length / orders.length) * 100) || 0
    };

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
