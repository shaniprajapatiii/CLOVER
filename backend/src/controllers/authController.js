const Worker = require('../models/Worker');
const { generateToken } = require('../middleware/auth');
const { calculateRiskScore } = require('../services/riskService');
const logger = require('../utils/logger');

exports.register = async (req, res) => {
  try {
    const {
      name, phone, email, password, platform, deliverySegment,
      vehicleType, city, zone, pincode, averageWeeklyEarnings,
      averageDailyHours, workingDaysPerWeek, experienceMonths, referralCode
    } = req.body;

    const existing = await Worker.findOne({ phone });
    if (existing) return res.status(400).json({ success: false, message: 'Phone number already registered.' });

    // Find referrer
    let referredBy = null;
    if (referralCode) {
      const referrer = await Worker.findOne({ referralCode: referralCode.toUpperCase() });
      if (referrer) {
        referredBy = referrer._id;
        referrer.referralCount += 1;
        referrer.loyaltyPoints += 100;
        await referrer.save();
      }
    }

    const worker = await Worker.create({
      name, phone, email, password, platform, deliverySegment,
      vehicleType, city, zone, pincode,
      averageWeeklyEarnings: averageWeeklyEarnings || 3500,
      averageDailyHours: averageDailyHours || 8,
      workingDaysPerWeek: workingDaysPerWeek || 6,
      experienceMonths: experienceMonths || 6,
      referredBy
    });

    // Calculate initial risk score
    const { riskScore, riskCategory, riskFactors } = calculateRiskScore(worker);
    worker.riskScore = riskScore;
    worker.riskCategory = riskCategory;
    worker.riskFactors = riskFactors;
    worker.lastRiskAssessment = new Date();
    await worker.save();

    const token = generateToken(worker._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to CLOVER.',
      token,
      worker: {
        _id: worker._id,
        name: worker.name,
        phone: worker.phone,
        email: worker.email,
        platform: worker.platform,
        city: worker.city,
        riskScore: worker.riskScore,
        riskCategory: worker.riskCategory,
        role: worker.role,
        referralCode: worker.referralCode,
        loyaltyPoints: worker.loyaltyPoints
      }
    });
  } catch (err) {
    logger.error('Register error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ success: false, message: 'Phone and password are required.' });
    }

    const worker = await Worker.findOne({ phone }).select('+password');
    if (!worker) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    if (worker.isLocked) {
      return res.status(401).json({ success: false, message: 'Account locked due to too many failed attempts. Try again later.' });
    }

    const isMatch = await worker.comparePassword(password);
    if (!isMatch) {
      worker.loginAttempts = (worker.loginAttempts || 0) + 1;
      if (worker.loginAttempts >= 5) {
        worker.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 min
      }
      await worker.save();
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    worker.loginAttempts = 0;
    worker.lockUntil = undefined;
    worker.lastLogin = new Date();
    await worker.save();

    const token = generateToken(worker._id);

    res.json({
      success: true,
      token,
      worker: {
        _id: worker._id,
        name: worker.name,
        phone: worker.phone,
        email: worker.email,
        platform: worker.platform,
        deliverySegment: worker.deliverySegment,
        city: worker.city,
        vehicleType: worker.vehicleType,
        riskScore: worker.riskScore,
        riskCategory: worker.riskCategory,
        activePolicyId: worker.activePolicyId,
        role: worker.role,
        isKycVerified: worker.isKycVerified,
        loyaltyPoints: worker.loyaltyPoints,
        streakWeeks: worker.streakWeeks,
        referralCode: worker.referralCode,
        averageWeeklyEarnings: worker.averageWeeklyEarnings
      }
    });
  } catch (err) {
    logger.error('Login error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const worker = await Worker.findById(req.worker._id).populate('activePolicyId');
    res.json({ success: true, worker });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const allowed = ['name', 'email', 'upiId', 'bankAccountNumber', 'ifscCode', 'averageWeeklyEarnings', 'averageDailyHours', 'fcmToken'];
    const updates = {};
    allowed.forEach(field => { if (req.body[field] !== undefined) updates[field] = req.body[field]; });

    const worker = await Worker.findByIdAndUpdate(req.worker._id, updates, { new: true, runValidators: true });
    res.json({ success: true, worker });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const worker = await Worker.findById(req.worker._id).select('+password');
    const isMatch = await worker.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    worker.password = newPassword;
    await worker.save();
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
