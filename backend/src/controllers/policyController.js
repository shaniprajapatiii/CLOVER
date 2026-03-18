const Policy = require('../models/Policy');
const Worker = require('../models/Worker');
const Notification = require('../models/Notification');
const { calculateWeeklyPremium, getAllPlanOptions, PLAN_COVERAGE_MULTIPLIERS, calculateRiskScore } = require('../services/riskService');
const logger = require('../utils/logger');

// GET /api/policies/plans - Get all plan options for the logged-in worker
exports.getPlanOptions = async (req, res) => {
  try {
    const worker = req.worker;
    const plans = getAllPlanOptions(worker);

    const response = {
      basic: {
        ...plans.basic,
        planName: 'Basic Shield',
        features: ['Coverage for top 3 disruptions', 'Weekly auto-payout', 'Basic fraud protection', 'Email support'],
        recommended: false
      },
      standard: {
        ...plans.standard,
        planName: 'Standard Shield',
        features: ['Coverage for 6 disruptions', 'Weekly auto-payout', 'AI fraud detection', 'Priority support', 'Loyalty rewards'],
        recommended: true
      },
      premium: {
        ...plans.premium,
        planName: 'Premium Shield',
        features: ['Coverage for all 11 disruptions', 'Instant auto-payout', 'Advanced AI protection', '24/7 support', 'Loyalty rewards', 'Referral bonus', 'Platform outage coverage'],
        recommended: false
      }
    };

    res.json({ success: true, plans: response, riskProfile: { score: worker.riskScore, category: worker.riskCategory } });
  } catch (err) {
    logger.error('getPlanOptions error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/policies - Create a new policy
exports.createPolicy = async (req, res) => {
  try {
    const { planType, paymentMethod } = req.body;
    const worker = req.worker;

    if (!['basic', 'standard', 'premium'].includes(planType)) {
      return res.status(400).json({ success: false, message: 'Invalid plan type.' });
    }

    // Check for active policy
    const existingPolicy = await Policy.findOne({ workerId: worker._id, status: 'active' });
    if (existingPolicy) {
      return res.status(400).json({ success: false, message: 'You already have an active policy. Please cancel it before purchasing a new one.', policy: existingPolicy });
    }

    const premiumData = calculateWeeklyPremium(worker, planType);
    const planNames = { basic: 'Basic Shield', standard: 'Standard Shield', premium: 'Premium Shield' };

    // Build coverage triggers based on plan
    const triggerConfigs = {
      extreme_heat: { threshold: { temp: 42 }, description: 'Temperature > 42°C', maxPayoutPercent: 70 },
      heavy_rain: { threshold: { rainfall: 64.5 }, description: 'Rainfall > 64.5mm/hr', maxPayoutPercent: 80 },
      severe_pollution: { threshold: { aqi: 301 }, description: 'AQI > 301 (Hazardous)', maxPayoutPercent: 60 },
      flood: { threshold: { rainfall: 115.6 }, description: 'Extreme flooding event', maxPayoutPercent: 100 },
      curfew: { threshold: {}, description: 'Government-declared curfew', maxPayoutPercent: 100 },
      strike: { threshold: {}, description: 'City-wide strike or bandh', maxPayoutPercent: 90 },
      platform_outage: { threshold: {}, description: 'Platform app outage > 3 hours', maxPayoutPercent: 50 },
      cyclone: { threshold: { windSpeed: 63 }, description: 'Cyclone warning', maxPayoutPercent: 100 },
      hailstorm: { threshold: {}, description: 'Hailstorm event', maxPayoutPercent: 75 },
      dense_fog: { threshold: { visibility: 200 }, description: 'Visibility < 200m', maxPayoutPercent: 60 },
      cold_wave: { threshold: { temp: 10 }, description: 'Temperature < 10°C', maxPayoutPercent: 50 }
    };

    const coverageTriggers = premiumData.coverageTriggers.map(t => ({
      type: t,
      ...triggerConfigs[t]
    }));

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    const policy = await Policy.create({
      workerId: worker._id,
      planType,
      planName: planNames[planType],
      coverageAmount: premiumData.coverageAmount,
      weeklyPremium: premiumData.finalPremium,
      coverageTriggers,
      startDate,
      endDate,
      renewalDate: endDate,
      status: 'active',
      totalPremiumPaid: premiumData.finalPremium,
      riskScoreAtCreation: worker.riskScore,
      city: worker.city,
      platform: worker.platform,
      deliverySegment: worker.deliverySegment,
      autoRenew: true,
      premiumBreakdown: premiumData,
      paymentHistory: [{
        amount: premiumData.finalPremium,
        paidAt: new Date(),
        transactionId: 'TXN-' + Date.now(),
        method: paymentMethod || 'upi',
        weekNumber: 1
      }]
    });

    // Update worker's active policy
    await Worker.findByIdAndUpdate(worker._id, {
      activePolicyId: policy._id,
      loyaltyPoints: (worker.loyaltyPoints || 0) + 50
    });

    // Reassess risk
    const { riskScore, riskCategory, riskFactors } = calculateRiskScore(worker);
    await Worker.findByIdAndUpdate(worker._id, { riskScore, riskCategory, riskFactors, lastRiskAssessment: new Date() });

    await Notification.create({
      workerId: worker._id,
      title: '🎉 Policy Activated!',
      message: `Your ${planNames[planType]} policy is now active. Coverage: ₹${premiumData.coverageAmount}/week. Policy #${policy.policyNumber}`,
      type: 'policy_created',
      priority: 'high',
      data: { policyId: policy._id }
    });

    res.status(201).json({ success: true, message: 'Policy created successfully!', policy });
  } catch (err) {
    logger.error('createPolicy error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/policies - Get all policies for a worker
exports.getMyPolicies = async (req, res) => {
  try {
    const policies = await Policy.find({ workerId: req.worker._id }).sort({ createdAt: -1 });
    res.json({ success: true, policies });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/policies/:id
exports.getPolicyById = async (req, res) => {
  try {
    const policy = await Policy.findOne({ _id: req.params.id, workerId: req.worker._id });
    if (!policy) return res.status(404).json({ success: false, message: 'Policy not found.' });
    res.json({ success: true, policy });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/policies/:id/renew
exports.renewPolicy = async (req, res) => {
  try {
    const policy = await Policy.findOne({ _id: req.params.id, workerId: req.worker._id });
    if (!policy) return res.status(404).json({ success: false, message: 'Policy not found.' });

    const worker = req.worker;
    const newPremium = calculateWeeklyPremium(worker, policy.planType);

    const newEndDate = new Date(policy.endDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    policy.endDate = newEndDate;
    policy.renewalDate = newEndDate;
    policy.status = 'active';
    policy.totalPremiumPaid += newPremium.finalPremium;
    policy.paymentHistory.push({
      amount: newPremium.finalPremium,
      paidAt: new Date(),
      transactionId: 'TXN-' + Date.now(),
      method: req.body.paymentMethod || 'upi',
      weekNumber: policy.paymentHistory.length + 1
    });
    await policy.save();

    // Streak bonus
    await Worker.findByIdAndUpdate(worker._id, {
      $inc: { streakWeeks: 1, loyaltyPoints: 25 }
    });

    await Notification.create({
      workerId: worker._id,
      title: '✅ Policy Renewed',
      message: `Your policy has been renewed for another week. Premium: ₹${newPremium.finalPremium}`,
      type: 'policy_renewed',
      data: { policyId: policy._id }
    });

    res.json({ success: true, message: 'Policy renewed successfully!', policy });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/policies/:id/cancel
exports.cancelPolicy = async (req, res) => {
  try {
    const policy = await Policy.findOne({ _id: req.params.id, workerId: req.worker._id, status: 'active' });
    if (!policy) return res.status(404).json({ success: false, message: 'Active policy not found.' });

    policy.status = 'cancelled';
    await policy.save();

    await Worker.findByIdAndUpdate(req.worker._id, { activePolicyId: null });

    res.json({ success: true, message: 'Policy cancelled.', policy });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
