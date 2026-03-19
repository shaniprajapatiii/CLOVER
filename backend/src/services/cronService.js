const cron = require('node-cron');
const logger = require('../utils/logger');
const { getWeatherForCities } = require('./weatherService');
const { autoTriggerClaims } = require('./claimService');

const MONITORED_CITIES = [
  { name: 'Mumbai', lat: 19.076, lon: 72.877 },
  { name: 'Delhi', lat: 28.704, lon: 77.102 },
  { name: 'Bangalore', lat: 12.972, lon: 77.594 },
  { name: 'Chennai', lat: 13.083, lon: 80.270 },
  { name: 'Kolkata', lat: 22.572, lon: 88.363 },
  { name: 'Hyderabad', lat: 17.385, lon: 78.487 },
  { name: 'Pune', lat: 18.520, lon: 73.857 },
  { name: 'Ahmedabad', lat: 23.022, lon: 72.572 },
  { name: 'Jaipur', lat: 26.912, lon: 75.787 },
  { name: 'Lucknow', lat: 26.847, lon: 80.946 }
];

const startCronJobs = () => {
  // Weather monitoring every 30 minutes
  cron.schedule(process.env.WEATHER_CHECK_INTERVAL || '*/30 * * * *', async () => {
    logger.info('Running weather monitoring cron...');
    try {
      const weatherResults = await getWeatherForCities(MONITORED_CITIES);
      const citiesWithTriggers = weatherResults.filter(r => r.triggers.length > 0);

      if (citiesWithTriggers.length > 0) {
        logger.info(`Weather triggers detected in: ${citiesWithTriggers.map(c => c.city).join(', ')}`);
        await autoTriggerClaims(citiesWithTriggers);
      }
    } catch (err) {
      logger.error('Weather monitoring cron error:', err);
    }
  });

  // Policy renewal check daily at midnight
  cron.schedule('0 0 * * *', async () => {
    logger.info('Running policy renewal cron...');
    try {
      const Policy = require('../models/Policy');
      const Notification = require('../models/Notification');
      const now = new Date();
      const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      // Find expiring policies
      const expiringPolicies = await Policy.find({
        status: 'active',
        endDate: { $gte: now, $lte: threeDaysLater }
      }).populate('workerId');

      for (const policy of expiringPolicies) {
        await Notification.create({
          workerId: policy.workerId._id,
          title: 'Policy Expiring Soon',
          message: `Your CLOVER policy ${policy.policyNumber} expires on ${policy.endDate.toDateString()}. Renew to stay protected!`,
          type: 'policy_expiring',
          priority: 'high',
          data: { policyId: policy._id, policyNumber: policy.policyNumber }
        });
      }

      // Auto-expire policies
      await Policy.updateMany(
        { status: 'active', endDate: { $lt: now } },
        { status: 'expired' }
      );

      logger.info(`Policy renewal cron: ${expiringPolicies.length} expiring policies notified`);
    } catch (err) {
      logger.error('Policy renewal cron error:', err);
    }
  });

  // Auto-process approved claims hourly
  cron.schedule(process.env.CLAIM_AUTO_PROCESS_INTERVAL || '0 * * * *', async () => {
    logger.info('Running claim auto-process cron...');
    try {
      const Claim = require('../models/Claim');
      const pendingClaims = await Claim.find({ status: 'approved', payoutStatus: 'pending' });

      for (const claim of pendingClaims) {
        // Simulate payout processing
        claim.payoutStatus = 'processing';
        await claim.save();
        logger.info(`Processing payout for claim ${claim.claimNumber}`);
      }
    } catch (err) {
      logger.error('Claim auto-process cron error:', err);
    }
  });

  logger.info('All cron jobs started successfully');
};

module.exports = { startCronJobs, MONITORED_CITIES };
