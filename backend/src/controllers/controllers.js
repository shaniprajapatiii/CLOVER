// ===== ANALYTICS CONTROLLER =====
const analyticsController = {};

analyticsController.getDashboardStats = async (req, res) => {
  try {
    const Claim = require('../models/Claim');
    const Policy = require('../models/Policy');
    const Worker = require('../models/Worker');
    const WeatherEvent = require('../models/WeatherEvent');
    const workerId = req.worker._id;

    const [policy, claims, recentClaims, weatherEvents] = await Promise.all([
      Policy.findOne({ workerId, status: 'active' }),
      Claim.aggregate([
        { $match: { workerId } },
        { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$approvedAmount' } } }
      ]),
      Claim.find({ workerId }).sort({ createdAt: -1 }).limit(5).populate('policyId', 'policyNumber'),
      WeatherEvent.find({ city: new RegExp(req.worker.city, 'i'), isActive: true }).sort({ startTime: -1 }).limit(3)
    ]);

    const claimStats = claims.reduce((acc, c) => {
      acc[c._id] = { count: c.count, total: c.total || 0 };
      return acc;
    }, {});

    const totalPaid = claims.filter(c => c._id === 'paid').reduce((a, c) => a + (c.total || 0), 0);
    const totalApproved = claims.filter(c => ['approved', 'paid'].includes(c._id)).reduce((a, c) => a + (c.count || 0), 0);
    const totalClaims = claims.reduce((a, c) => a + c.count, 0);

    res.json({
      success: true,
      dashboard: {
        policy,
        claimStats,
        totalPaid,
        totalClaims,
        approvalRate: totalClaims > 0 ? Math.round((totalApproved / totalClaims) * 100) : 0,
        recentClaims,
        weatherAlerts: weatherEvents,
        worker: {
          riskScore: req.worker.riskScore,
          riskCategory: req.worker.riskCategory,
          loyaltyPoints: req.worker.loyaltyPoints,
          streakWeeks: req.worker.streakWeeks,
          referralCode: req.worker.referralCode
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

analyticsController.getEarningsProtected = async (req, res) => {
  try {
    const Claim = require('../models/Claim');
    const months = parseInt(req.query.months) || 3;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const data = await Claim.aggregate([
      { $match: { workerId: req.worker._id, createdAt: { $gte: startDate }, status: { $in: ['approved', 'paid'] } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, week: { $week: '$createdAt' } }, totalProtected: { $sum: '$approvedAmount' }, claimsCount: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1 } }
    ]);

    res.json({ success: true, data, period: `${months} months` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

analyticsController.getAdminAnalytics = async (req, res) => {
  try {
    const Claim = require('../models/Claim');
    const Policy = require('../models/Policy');
    const Worker = require('../models/Worker');

    const [totalWorkers, activeWorkers, totalPolicies, activePolicies, claimsData, fraudStats, cityWiseWorkers, triggerWiseClaims, weeklyRevenue] = await Promise.all([
      Worker.countDocuments({ role: 'worker' }),
      Worker.countDocuments({ role: 'worker', isActive: true }),
      Policy.countDocuments(),
      Policy.countDocuments({ status: 'active' }),
      Claim.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$approvedAmount' } } }
      ]),
      Claim.aggregate([
        { $match: { isFraudulent: true } },
        { $group: { _id: null, count: { $sum: 1 }, savedAmount: { $sum: '$claimAmount' } } }
      ]),
      Worker.aggregate([
        { $group: { _id: '$city', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Claim.aggregate([
        { $group: { _id: '$triggerType', count: { $sum: 1 }, totalPaid: { $sum: '$approvedAmount' } } },
        { $sort: { count: -1 } }
      ]),
      Policy.aggregate([
        { $group: { _id: null, totalRevenue: { $sum: '$totalPremiumPaid' }, avgPremium: { $avg: '$weeklyPremium' } } }
      ])
    ]);

    const claimsByStatus = claimsData.reduce((acc, c) => {
      acc[c._id] = { count: c.count, amount: c.totalAmount || 0 };
      return acc;
    }, {});

    res.json({
      success: true,
      analytics: {
        workers: { total: totalWorkers, active: activeWorkers },
        policies: { total: totalPolicies, active: activePolicies },
        claims: claimsByStatus,
        fraud: { detected: fraudStats[0]?.count || 0, amountSaved: fraudStats[0]?.savedAmount || 0 },
        cityWise: cityWiseWorkers,
        triggerWise: triggerWiseClaims,
        revenue: weeklyRevenue[0] || { totalRevenue: 0, avgPremium: 0 }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ===== WEATHER CONTROLLER =====
const weatherController = {};

weatherController.getCurrentWeather = async (req, res) => {
  try {
    const { fetchWeatherData, fetchAQIData, evaluateTriggers } = require('../services/weatherService');
    const city = req.query.city || req.worker.city;
    const weather = await fetchWeatherData(city);
    const aqi = await fetchAQIData(city);
    weather.aqi = aqi;
    const triggers = evaluateTriggers(weather);
    res.json({ success: true, city, weather, triggers, timestamp: new Date() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

weatherController.getWeatherEvents = async (req, res) => {
  try {
    const WeatherEvent = require('../models/WeatherEvent');
    const { city, active, limit = 20 } = req.query;
    const filter = {};
    if (city) filter.city = new RegExp(city, 'i');
    if (active === 'true') filter.isActive = true;
    const events = await WeatherEvent.find(filter).sort({ startTime: -1 }).limit(parseInt(limit));
    res.json({ success: true, events });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

weatherController.simulateWeatherEvent = async (req, res) => {
  try {
    const WeatherEvent = require('../models/WeatherEvent');
    const { city, eventType, severity } = req.body;
    const event = await WeatherEvent.create({
      city, eventType, severity,
      data: { temperature: 45, rainfall: 100, aqiIndex: 350, description: 'Simulated event' },
      startTime: new Date(),
      isActive: true,
      isTriggerMet: true,
      source: 'mock'
    });

    // Auto-trigger claims
    const { autoTriggerClaims } = require('../services/claimService');
    const triggered = await autoTriggerClaims([{ city, triggers: [{ type: eventType, severity }], weather: { temp: 45, rainfall: 100, aqi: 350, description: 'simulated', source: 'mock' } }]);

    res.json({ success: true, message: `Simulated ${eventType} in ${city}. ${triggered} claims triggered.`, event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ===== RISK CONTROLLER =====
const riskController = {};

riskController.assessRisk = async (req, res) => {
  try {
    const { calculateRiskScore, getAllPlanOptions } = require('../services/riskService');
    const worker = req.worker;
    const { riskScore, riskCategory, riskFactors } = calculateRiskScore(worker);
    const plans = getAllPlanOptions(worker);

    const Worker = require('../models/Worker');
    await Worker.findByIdAndUpdate(worker._id, { riskScore, riskCategory, riskFactors, lastRiskAssessment: new Date() });

    res.json({ success: true, riskScore, riskCategory, riskFactors, plans, lastAssessed: new Date() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ===== NOTIFICATION CONTROLLER =====
const notificationController = {};

notificationController.getNotifications = async (req, res) => {
  try {
    const Notification = require('../models/Notification');
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const filter = { workerId: req.worker._id };
    if (unreadOnly === 'true') filter.isRead = false;

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const unreadCount = await Notification.countDocuments({ workerId: req.worker._id, isRead: false });
    res.json({ success: true, notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

notificationController.markAllRead = async (req, res) => {
  try {
    const Notification = require('../models/Notification');
    await Notification.updateMany({ workerId: req.worker._id, isRead: false }, { isRead: true, readAt: new Date() });
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

notificationController.markRead = async (req, res) => {
  try {
    const Notification = require('../models/Notification');
    await Notification.findOneAndUpdate({ _id: req.params.id, workerId: req.worker._id }, { isRead: true, readAt: new Date() });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ===== PAYMENT CONTROLLER =====
const paymentController = {};

paymentController.initiatePayment = async (req, res) => {
  try {
    const { amount, purpose, policyId } = req.body;
    // Mock Razorpay order (replace with real Razorpay SDK in production)
    const order = {
      id: 'order_' + Date.now(),
      amount: amount * 100, // paise
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      status: 'created',
      notes: { workerId: req.worker._id, purpose, policyId }
    };
    res.json({ success: true, order, keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

paymentController.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    // Mock verification (implement actual signature check in production)
    const isValid = true; // crypto.createHmac check
    if (!isValid) return res.status(400).json({ success: false, message: 'Payment verification failed.' });
    res.json({ success: true, message: 'Payment verified.', paymentId: razorpay_payment_id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ===== WORKER CONTROLLER =====
const workerController = {};

workerController.getLeaderboard = async (req, res) => {
  try {
    const Worker = require('../models/Worker');
    const workers = await Worker.find({ role: 'worker', isActive: true })
      .select('name platform city loyaltyPoints streakWeeks referralCount')
      .sort({ loyaltyPoints: -1 })
      .limit(20);
    res.json({ success: true, leaderboard: workers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

workerController.getReferralStats = async (req, res) => {
  try {
    const Worker = require('../models/Worker');
    const worker = req.worker;
    const referrals = await Worker.find({ referredBy: worker._id }).select('name platform city createdAt');
    res.json({ success: true, referralCode: worker.referralCode, referralCount: worker.referralCount, referrals, pointsEarned: worker.referralCount * 100 });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

workerController.submitKyc = async (req, res) => {
  try {
    const { aadhaarNumber, panNumber, bankAccountNumber, ifscCode, upiId } = req.body;
    const Worker = require('../models/Worker');
    const worker = await Worker.findByIdAndUpdate(req.worker._id, {
      aadhaarNumber, panNumber, bankAccountNumber, ifscCode, upiId,
      isKycVerified: true
    }, { new: true });
    res.json({ success: true, message: 'KYC submitted successfully.', worker });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ===== ADMIN CONTROLLER =====
const adminController = {};

adminController.getAllWorkers = async (req, res) => {
  try {
    const Worker = require('../models/Worker');
    const { page = 1, limit = 20, city, platform, riskCategory } = req.query;
    const filter = { role: 'worker' };
    if (city) filter.city = new RegExp(city, 'i');
    if (platform) filter.platform = platform;
    if (riskCategory) filter.riskCategory = riskCategory;

    const workers = await Worker.find(filter).populate('activePolicyId', 'planType status').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit));
    const total = await Worker.countDocuments(filter);
    res.json({ success: true, workers, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

adminController.toggleWorkerStatus = async (req, res) => {
  try {
    const Worker = require('../models/Worker');
    const worker = await Worker.findById(req.params.id);
    if (!worker) return res.status(404).json({ success: false, message: 'Worker not found.' });
    worker.isActive = !worker.isActive;
    await worker.save();
    res.json({ success: true, message: `Worker ${worker.isActive ? 'activated' : 'deactivated'}.`, isActive: worker.isActive });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { analyticsController, weatherController, riskController, notificationController, paymentController, workerController, adminController };
