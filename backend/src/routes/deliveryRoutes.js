const express = require('express');
const { body, query, param } = require('express-validator');
const orderController = require('../controllers/orderController');
const deliveryController = require('../controllers/deliveryController');
const activityController = require('../controllers/activityController');
const { protect: authMiddleware } = require('../middleware/auth');

const router = express.Router();

// ==================== ORDER ROUTES ====================

// Create new order
router.post('/orders', authMiddleware, [
  body('customerName').trim().notEmpty().withMessage('Customer name required'),
  body('customerPhone').trim().notEmpty().withMessage('Phone required'),
  body('items').isArray().notEmpty().withMessage('Items required'),
  body('totalAmount').isFloat({ min: 0 }).withMessage('Valid amount required'),
  body('pickupLocation').notEmpty().withMessage('Pickup location required'),
  body('dropLocation').notEmpty().withMessage('Drop location required'),
  body('estimatedDeliveryTime').isInt({ min: 5 }).withMessage('Estimated time required')
], orderController.createOrder);

// Get available orders (for delivery partners)
router.get('/orders/available', [
  query('latitude').optional().isFloat().withMessage('Valid latitude'),
  query('longitude').optional().isFloat().withMessage('Valid longitude'),
  query('maxDistance').optional().isInt({ min: 1 }).withMessage('Valid distance')
], orderController.getAvailableOrders);

// Get specific order details
router.get('/orders/:orderId', authMiddleware, [
  param('orderId').isMongoId().withMessage('Invalid order ID')
], orderController.getOrderDetails);

// Get worker's orders
router.get('/workers/:workerId/orders', authMiddleware, [
  param('workerId').isMongoId().withMessage('Invalid worker ID'),
  query('status').optional().isIn(['pending', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled'])
], orderController.getWorkerOrders);

// Accept order
router.put('/orders/:orderId/accept', authMiddleware, [
  param('orderId').isMongoId().withMessage('Invalid order ID'),
  body('workerId').isMongoId().withMessage('Invalid worker ID')
], orderController.acceptOrder);

// Update order status
router.put('/orders/:orderId/status', authMiddleware, [
  param('orderId').isMongoId().withMessage('Invalid order ID'),
  body('status').isIn(['accepted', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'failed']),
  body('location').optional().notEmpty()
], orderController.updateOrderStatus);

// Log real-time location for order
router.post('/orders/:orderId/location', authMiddleware, [
  param('orderId').isMongoId().withMessage('Invalid order ID'),
  body('latitude').isFloat().withMessage('Valid latitude required'),
  body('longitude').isFloat().withMessage('Valid longitude required'),
  body('batteryLevel').optional().isInt({ min: 0, max: 100 }),
  body('connectionType').optional().isIn(['wifi', '2g', '3g', '4g', '5g'])
], orderController.logOrderLocation);

// Complete delivery with proof
router.post('/orders/:orderId/complete', authMiddleware, [
  param('orderId').isMongoId().withMessage('Invalid order ID'),
  body('photo').notEmpty().withMessage('Delivery photo required'),
  body('location').notEmpty().withMessage('Location required')
], orderController.completeDelivery);

// Cancel order
router.put('/orders/:orderId/cancel', authMiddleware, [
  param('orderId').isMongoId().withMessage('Invalid order ID'),
  body('reason').optional().trim()
], orderController.cancelOrder);

// Get order analytics
router.get('/orders/analytics/summary', authMiddleware, [
  query('workerId').optional().isMongoId(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], orderController.getOrderAnalytics);

// ==================== DELIVERY ROUTES ====================

// Get delivery details
router.get('/deliveries/:deliveryId', authMiddleware, [
  param('deliveryId').isMongoId().withMessage('Invalid delivery ID')
], deliveryController.getDeliveryDetails);

// Get worker's active deliveries
router.get('/workers/:workerId/deliveries', authMiddleware, [
  param('workerId').isMongoId().withMessage('Invalid worker ID'),
  query('status').optional()
], deliveryController.getWorkerActiveDeliveries);

// Update delivery status
router.put('/deliveries/:deliveryId/status', authMiddleware, [
  param('deliveryId').isMongoId().withMessage('Invalid delivery ID'),
  body('status').isIn(['accepted', 'picked_up', 'on_way', 'arrived', 'completed', 'cancelled', 'failed']),
  body('location').optional(),
  body('notes').optional().trim()
], deliveryController.updateDeliveryStatus);

// Submit delivery proof
router.post('/deliveries/:deliveryId/proof', authMiddleware, [
  param('deliveryId').isMongoId().withMessage('Invalid delivery ID'),
  body('photo').notEmpty().withMessage('Photo required'),
  body('location').notEmpty().withMessage('Location required')
], deliveryController.submitDeliveryProof);

// Get delivery analytics
router.get('/deliveries/:deliveryId/analytics', authMiddleware, [
  param('deliveryId').isMongoId().withMessage('Invalid delivery ID')
], deliveryController.getDeliveryAnalytics);

// Rate delivery
router.post('/deliveries/:deliveryId/rate', [
  param('deliveryId').isMongoId().withMessage('Invalid delivery ID'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
  body('feedback').optional().trim()
], deliveryController.rateDelivery);

// Get worker delivery statistics
router.get('/workers/:workerId/delivery-stats', authMiddleware, [
  param('workerId').isMongoId().withMessage('Invalid worker ID'),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], deliveryController.getWorkerDeliveryStats);

// Cancel delivery
router.put('/deliveries/:deliveryId/cancel', authMiddleware, [
  param('deliveryId').isMongoId().withMessage('Invalid delivery ID'),
  body('reason').optional().trim()
], deliveryController.cancelDelivery);

// ==================== ACTIVITY LOGGING ROUTES ====================

// Log worker activity (real-time)
router.post('/activities/log', authMiddleware, [
  body('workerId').isMongoId().withMessage('Invalid worker ID'),
  body('activityType').isIn(['online', 'offline', 'order_accepted', 'order_picked', 'order_delivered', 'location_update', 'order_cancelled', 'pause']),
  body('location').notEmpty().withMessage('Location required'),
  body('location.latitude').isFloat().withMessage('Valid latitude required'),
  body('location.longitude').isFloat().withMessage('Valid longitude required'),
  body('orderId').optional().isMongoId()
], activityController.logActivity);

// Get worker activity timeline
router.get('/workers/:workerId/activities', authMiddleware, [
  param('workerId').isMongoId().withMessage('Invalid worker ID'),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('skip').optional().isInt({ min: 0 })
], activityController.getWorkerActivityTimeline);

// Get delivery progress/tracking
router.get('/orders/:orderId/tracking', authMiddleware, [
  param('orderId').isMongoId().withMessage('Invalid order ID')
], activityController.getDeliveryProgress);

// Sync unsynced activities to CLOVER
router.post('/activities/sync-to-clover', authMiddleware, [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], activityController.syncActivityToCLOVER);

// Get worker activity statistics (for CLOVER claims)
router.get('/workers/:workerId/activity-stats', authMiddleware, [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], activityController.getWorkerActivityStats);

// Detect activity anomalies
router.get('/activities/anomalies/:workerId', authMiddleware, [
  param('workerId').isMongoId().withMessage('Invalid worker ID')
], activityController.detectAnomalies);

router.get('/activities/anomalies/order/:orderId', authMiddleware, [
  param('orderId').isMongoId().withMessage('Invalid order ID')
], activityController.detectAnomalies);

// ==================== REAL-TIME TRACKING (WebSocket will be separate) ====================

module.exports = router;
