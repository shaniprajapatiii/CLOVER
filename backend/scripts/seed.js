require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/clover';

const seed = async () => {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB for seeding...');

  const Worker = require('../src/models/Worker');
  const Policy = require('../src/models/Policy');
  const Claim = require('../src/models/Claim');
  const WeatherEvent = require('../src/models/WeatherEvent');

  // Clear existing data
  await Promise.all([Worker.deleteMany({}), Policy.deleteMany({}), Claim.deleteMany({}), WeatherEvent.deleteMany({})]);
  console.log('Cleared existing data.');

  // Create admin
  const admin = await Worker.create({
    name: 'Admin User', phone: '9000000000', email: 'admin@clover.in',
    password: 'Admin@123', platform: 'zomato', deliverySegment: 'food',
    vehicleType: 'motorcycle', city: 'Mumbai', role: 'admin',
    averageWeeklyEarnings: 5000, isKycVerified: true
  });

  // Create sample workers
  const workersData = [
    { name: 'Ravi Kumar', phone: '9876543210', platform: 'zomato', deliverySegment: 'food', vehicleType: 'motorcycle', city: 'Mumbai', experienceMonths: 18, averageWeeklyEarnings: 4200 },
    { name: 'Amit Singh', phone: '9876543211', platform: 'swiggy', deliverySegment: 'food', vehicleType: 'scooter', city: 'Delhi', experienceMonths: 6, averageWeeklyEarnings: 3800 },
    { name: 'Priya Sharma', phone: '9876543212', platform: 'zepto', deliverySegment: 'grocery_qcommerce', vehicleType: 'electric_scooter', city: 'Bangalore', experienceMonths: 12, averageWeeklyEarnings: 3500 },
    { name: 'Suresh Patel', phone: '9876543213', platform: 'amazon', deliverySegment: 'ecommerce', vehicleType: 'motorcycle', city: 'Ahmedabad', experienceMonths: 24, averageWeeklyEarnings: 5500 },
    { name: 'Deepak Yadav', phone: '9876543214', platform: 'blinkit', deliverySegment: 'grocery_qcommerce', vehicleType: 'bicycle', city: 'Delhi', experienceMonths: 3, averageWeeklyEarnings: 2800 },
    { name: 'Mohan Das', phone: '9876543215', platform: 'flipkart', deliverySegment: 'ecommerce', vehicleType: 'motorcycle', city: 'Chennai', experienceMonths: 8, averageWeeklyEarnings: 4000 },
  ];

  const workers = [];
  for (const w of workersData) {
    const worker = await Worker.create({ ...w, password: 'Worker@123', isKycVerified: true, upiId: `${w.phone}@upi`, riskScore: Math.random() * 0.5 + 0.3, riskCategory: 'medium' });
    workers.push(worker);
  }

  // Create policies
  const planTypes = ['basic', 'standard', 'premium'];
  const policies = [];
  for (let i = 0; i < workers.length; i++) {
    const w = workers[i];
    const planType = planTypes[i % 3];
    const premiums = { basic: 49, standard: 89, premium: 139 };
    const coverages = { basic: 1800, standard: 2800, premium: 4000 };

    const policy = await Policy.create({
      workerId: w._id, planType,
      planName: { basic: 'Basic Shield', standard: 'Standard Shield', premium: 'Premium Shield' }[planType],
      coverageAmount: coverages[planType],
      weeklyPremium: premiums[planType],
      coverageTriggers: [
        { type: 'extreme_heat', threshold: { temp: 42 }, description: 'Temperature > 42°C', maxPayoutPercent: 70 },
        { type: 'heavy_rain', threshold: { rainfall: 64.5 }, description: 'Rainfall > 64.5mm', maxPayoutPercent: 80 },
        { type: 'severe_pollution', threshold: { aqi: 301 }, description: 'AQI > 301', maxPayoutPercent: 60 },
      ],
      startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      status: 'active', city: w.city, platform: w.platform, deliverySegment: w.deliverySegment,
      totalPremiumPaid: premiums[planType], riskScoreAtCreation: 0.45,
      paymentHistory: [{ amount: premiums[planType], paidAt: new Date(), transactionId: 'TXN-SEED-' + i, method: 'upi', weekNumber: 1 }]
    });
    policies.push(policy);
    await Worker.findByIdAndUpdate(w._id, { activePolicyId: policy._id });
  }

  // Create claims
  const triggerTypes = ['extreme_heat', 'heavy_rain', 'severe_pollution', 'flood', 'curfew'];
  const statuses = ['paid', 'approved', 'under_review', 'rejected', 'auto_triggered'];

  for (let i = 0; i < 15; i++) {
    const worker = workers[i % workers.length];
    const policy = policies[i % policies.length];
    const trigger = triggerTypes[i % triggerTypes.length];
    const status = statuses[i % statuses.length];
    const amount = Math.round(Math.random() * 1500 + 500);

    await Claim.create({
      workerId: worker._id, policyId: policy._id,
      triggerType: trigger,
      triggerDescription: `${trigger} detected in ${worker.city}`,
      triggerData: { weatherCondition: 'heavy rain', temperature: 44, rainfall: 80, aqiIndex: 320, sourceApi: 'mock' },
      disruptionStartDate: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000),
      estimatedLoss: amount * 1.2, claimAmount: amount,
      approvedAmount: ['paid', 'approved'].includes(status) ? amount : 0,
      location: { city: worker.city, pincode: '400001' },
      status, isAutoTriggered: i % 3 === 0,
      fraudScore: Math.random() * 0.3,
      payoutStatus: status === 'paid' ? 'completed' : 'pending',
      payoutMethod: 'upi', paidAt: status === 'paid' ? new Date() : null
    });
  }

  // Create weather events
  const weatherData = [
    { city: 'Mumbai', eventType: 'heavy_rain', severity: 'high', temp: 32, rainfall: 90, aqi: 85 },
    { city: 'Delhi', eventType: 'severe_pollution', severity: 'extreme', temp: 38, aqi: 420 },
    { city: 'Ahmedabad', eventType: 'extreme_heat', severity: 'extreme', temp: 46, aqi: 150 },
    { city: 'Chennai', eventType: 'heavy_rain', severity: 'moderate', temp: 34, rainfall: 70 },
  ];

  for (const w of weatherData) {
    await WeatherEvent.create({
      city: w.city, eventType: w.eventType, severity: w.severity,
      data: { temperature: w.temp, rainfall: w.rainfall || 0, aqiIndex: w.aqi || 100, description: w.eventType },
      startTime: new Date(), isActive: true, isTriggerMet: true, source: 'mock',
      affectedWorkerCount: Math.floor(Math.random() * 50 + 10), claimsTriggered: Math.floor(Math.random() * 10)
    });
  }

  console.log('✅ Seed completed!');
  console.log('Admin: phone=9000000000, password=Admin@123');
  console.log('Worker: phone=9876543210, password=Worker@123');
  await mongoose.disconnect();
};

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
