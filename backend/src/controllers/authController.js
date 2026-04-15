const Worker = require('../models/Worker');
const { generateToken } = require('../middleware/auth');
const { calculateRiskScore } = require('../services/riskService');
const logger = require('../utils/logger');

// In-memory OTP store for development.
// Format: phone -> { code, expiresAt }
const otpStore = new Map();

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

exports.completeWorkerRegistration = async (req, res) => {
  try {
    const worker = await Worker.findById(req.worker._id);
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found.' });
    }

    const {
      phone,
      firstName,
      lastName,
      email,
      dateOfBirth,
      gender,
      address,
      city,
      state,
      zipCode,
      accountHolderName,
      accountNumber,
      ifscCode,
      bankName,
      vehicleType,
      vehicleNumber,
      vehicleModel,
      panNumber,
      drivingLicenseNumber,
      aadharNumber
    } = req.body;

    const vehicleTypeMap = {
      'two-wheeler': 'motorcycle',
      'three-wheeler': 'scooter',
      'four-wheeler': 'car'
    };

    worker.name = [firstName, lastName].filter(Boolean).join(' ').trim() || worker.name;
    worker.phone = phone || worker.phone;
    worker.email = email || worker.email;
    worker.dateOfBirth = dateOfBirth || worker.dateOfBirth;
    worker.gender = gender || worker.gender;
    worker.address = address || worker.address;
    worker.city = city || worker.city;
    worker.state = state || worker.state;
    worker.pincode = zipCode || worker.pincode;
    worker.bankAccountNumber = accountNumber || worker.bankAccountNumber;
    worker.ifscCode = ifscCode || worker.ifscCode;
    worker.bankName = bankName || worker.bankName;
    worker.vehicleType = vehicleTypeMap[vehicleType] || worker.vehicleType;
    worker.vehicleNumber = vehicleNumber || worker.vehicleNumber;
    worker.vehicleModel = vehicleModel || worker.vehicleModel;
    worker.panNumber = panNumber || worker.panNumber;
    worker.drivingLicenseNumber = drivingLicenseNumber || worker.drivingLicenseNumber;
    worker.aadhaarNumber = aadharNumber || worker.aadhaarNumber;
    worker.isKycVerified = Boolean(worker.aadhaarNumber && worker.panNumber && worker.drivingLicenseNumber);

    await worker.save();

    res.status(200).json({
      success: true,
      message: 'Registration completed successfully.',
      worker: {
        _id: worker._id,
        name: worker.name,
        phone: worker.phone,
        email: worker.email,
        city: worker.city,
        state: worker.state,
        pincode: worker.pincode,
        vehicleType: worker.vehicleType,
        bankName: worker.bankName,
        isKycVerified: worker.isKycVerified
      }
    });
  } catch (err) {
    logger.error('completeWorkerRegistration error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getWorkerProfileById = async (req, res) => {
  try {
    const { id } = req.params;
    if (String(req.worker._id) !== String(id) && req.worker.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this profile.' });
    }

    const worker = await Worker.findById(id).select('-password');
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found.' });
    }

    const nameParts = (worker.name || '').trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    res.status(200).json({
      success: true,
      worker: {
        _id: worker._id,
        firstName,
        lastName,
        name: worker.name,
        phone: worker.phone,
        email: worker.email,
        dateOfBirth: worker.dateOfBirth,
        gender: worker.gender,
        address: worker.address,
        city: worker.city,
        state: worker.state,
        zipCode: worker.pincode,
        accountHolderName: worker.accountHolderName,
        accountNumber: worker.bankAccountNumber,
        ifscCode: worker.ifscCode,
        bankName: worker.bankName,
        upiId: worker.upiId,
        vehicleType: worker.vehicleType,
        vehicleNumber: worker.vehicleNumber,
        vehicleModel: worker.vehicleModel,
        panNumber: worker.panNumber,
        drivingLicenseNumber: worker.drivingLicenseNumber,
        aadharNumber: worker.aadhaarNumber,
        emergencyContactName: worker.emergencyContactName,
        emergencyContactPhone: worker.emergencyContactPhone,
        preferredShift: worker.preferredShift,
        availabilityRadiusKm: worker.availabilityRadiusKm,
        preferredAreas: worker.preferredAreas || [],
        languages: worker.languages || [],
        isOnDuty: worker.isOnDuty,
        isKycVerified: worker.isKycVerified,
        rating: 4.8,
        totalDeliveries: 0
      }
    });
  } catch (err) {
    logger.error('getWorkerProfileById error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateWorkerProfileById = async (req, res) => {
  try {
    const { id } = req.params;
    if (String(req.worker._id) !== String(id) && req.worker.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this profile.' });
    }

    const worker = await Worker.findById(id);
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found.' });
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      city,
      state,
      zipCode,
      accountHolderName,
      accountNumber,
      ifscCode,
      bankName,
      upiId,
      vehicleType,
      vehicleNumber,
      vehicleModel,
      panNumber,
      drivingLicenseNumber,
      aadharNumber,
      emergencyContactName,
      emergencyContactPhone,
      preferredShift,
      availabilityRadiusKm,
      preferredAreas,
      languages,
      isOnDuty
    } = req.body;

    if (firstName || lastName) {
      const fullName = [firstName || '', lastName || ''].join(' ').trim();
      if (fullName) worker.name = fullName;
    }

    if (email !== undefined) worker.email = email;
    if (phone !== undefined) worker.phone = phone;
    if (dateOfBirth !== undefined) worker.dateOfBirth = dateOfBirth;
    if (gender !== undefined) worker.gender = gender;
    if (address !== undefined) worker.address = address;
    if (city !== undefined) worker.city = city;
    if (state !== undefined) worker.state = state;
    if (zipCode !== undefined) worker.pincode = zipCode;

    if (accountHolderName !== undefined) worker.accountHolderName = accountHolderName;
    if (accountNumber !== undefined) worker.bankAccountNumber = accountNumber;
    if (ifscCode !== undefined) worker.ifscCode = ifscCode;
    if (bankName !== undefined) worker.bankName = bankName;
    if (upiId !== undefined) worker.upiId = upiId;

    if (vehicleType !== undefined) worker.vehicleType = vehicleType;
    if (vehicleNumber !== undefined) worker.vehicleNumber = vehicleNumber;
    if (vehicleModel !== undefined) worker.vehicleModel = vehicleModel;

    if (panNumber !== undefined) worker.panNumber = panNumber;
    if (drivingLicenseNumber !== undefined) worker.drivingLicenseNumber = drivingLicenseNumber;
    if (aadharNumber !== undefined) worker.aadhaarNumber = aadharNumber;

    if (emergencyContactName !== undefined) worker.emergencyContactName = emergencyContactName;
    if (emergencyContactPhone !== undefined) worker.emergencyContactPhone = emergencyContactPhone;
    if (preferredShift !== undefined) worker.preferredShift = preferredShift;
    if (availabilityRadiusKm !== undefined) worker.availabilityRadiusKm = availabilityRadiusKm;
    if (preferredAreas !== undefined) worker.preferredAreas = preferredAreas;
    if (languages !== undefined) worker.languages = languages;
    if (isOnDuty !== undefined) worker.isOnDuty = !!isOnDuty;

    const hasCoreProfile = !!(worker.name && worker.email && worker.phone && worker.city);
    const hasKycTriplet = !!(worker.aadhaarNumber && worker.panNumber && worker.drivingLicenseNumber);
    worker.isKycVerified = hasKycTriplet;
    if (hasCoreProfile && hasKycTriplet) {
      worker.profileCompletedAt = worker.profileCompletedAt || new Date();
    }

    await worker.save();

    const nameParts = (worker.name || '').trim().split(/\s+/);
    const normalized = {
      _id: worker._id,
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      phone: worker.phone,
      email: worker.email,
      dateOfBirth: worker.dateOfBirth,
      gender: worker.gender,
      address: worker.address,
      city: worker.city,
      state: worker.state,
      zipCode: worker.pincode,
      accountHolderName: worker.accountHolderName,
      accountNumber: worker.bankAccountNumber,
      ifscCode: worker.ifscCode,
      bankName: worker.bankName,
      upiId: worker.upiId,
      vehicleType: worker.vehicleType,
      vehicleNumber: worker.vehicleNumber,
      vehicleModel: worker.vehicleModel,
      panNumber: worker.panNumber,
      drivingLicenseNumber: worker.drivingLicenseNumber,
      aadharNumber: worker.aadhaarNumber,
      emergencyContactName: worker.emergencyContactName,
      emergencyContactPhone: worker.emergencyContactPhone,
      preferredShift: worker.preferredShift,
      availabilityRadiusKm: worker.availabilityRadiusKm,
      preferredAreas: worker.preferredAreas || [],
      languages: worker.languages || [],
      isOnDuty: worker.isOnDuty,
      isKycVerified: worker.isKycVerified
    };

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      worker: normalized
    });
  } catch (err) {
    logger.error('updateWorkerProfileById error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Valid 10-digit phone is required.' });
    }

    // Use fixed OTP in development for easier testing.
    const code = process.env.NODE_ENV === 'production'
      ? String(Math.floor(1000 + Math.random() * 9000))
      : '1234';

    otpStore.set(phone, {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully.',
      ...(process.env.NODE_ENV !== 'production' && { devOtp: code })
    });
  } catch (err) {
    logger.error('sendOtp error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone and OTP are required.' });
    }

    const otpEntry = otpStore.get(phone);
    const devBypass = process.env.NODE_ENV !== 'production' && otp === '1234';

    if (!devBypass) {
      if (!otpEntry || Date.now() > otpEntry.expiresAt) {
        return res.status(400).json({ success: false, message: 'OTP expired. Please request again.' });
      }
      if (String(otpEntry.code) !== String(otp)) {
        return res.status(400).json({ success: false, message: 'Invalid OTP.' });
      }
    }

    otpStore.delete(phone);

    let worker = await Worker.findOne({ phone });
    if (!worker) {
      // Create a minimal worker profile to allow OTP-first onboarding.
      worker = await Worker.create({
        name: `Partner-${phone.slice(-4)}`,
        phone,
        password: `otp-${phone}-temp`,
        platform: 'other',
        deliverySegment: 'food',
        vehicleType: 'motorcycle',
        city: 'Mumbai'
      });
    }

    const token = generateToken(worker._id);

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully.',
      token,
      _id: worker._id,
      worker: {
        _id: worker._id,
        name: worker.name,
        phone: worker.phone,
        city: worker.city,
        role: worker.role
      }
    });
  } catch (err) {
    logger.error('verifyOtp error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
