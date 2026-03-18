const Claim = require('../models/Claim');
const Policy = require('../models/Policy');
const Worker = require('../models/Worker');
const Notification = require('../models/Notification');
const WeatherEvent = require('../models/WeatherEvent');
const { analyzeClaim } = require('./fraudService');
const logger = require('../utils/logger');

/**
 * Auto-trigger claims for all workers in affected cities
 */
const autoTriggerClaims = async (citiesWithTriggers) => {
  let totalTriggered = 0;

  for (const cityData of citiesWithTriggers) {
    const { city, triggers, weather } = cityData;

    for (const trigger of triggers) {
      // Find active policies in this city
      const activePolicies = await Policy.find({ status: 'active', city: new RegExp(city, 'i') })
        .populate('workerId');

      const weatherEvent = await WeatherEvent.findOne({
        city: new RegExp(city, 'i'),
        eventType: trigger.type,
        isActive: true
      }).sort({ startTime: -1 });

      for (const policy of activePolicies) {
        if (!policy.workerId) continue;

        // Check if policy covers this trigger
        const coversTrigger = policy.coverageTriggers?.some(ct => ct.type === trigger.type);
        if (!coversTrigger) continue;

        // Check for existing auto-triggered claim today
        const existingClaim = await Claim.findOne({
          workerId: policy.workerId._id,
          policyId: policy._id,
          triggerType: trigger.type,
          isAutoTriggered: true,
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        if (existingClaim) continue;

        // Calculate payout based on severity
        const severityMultiplier = { low: 0.3, moderate: 0.5, high: 0.75, extreme: 1.0 };
        const mult = severityMultiplier[trigger.severity] || 0.5;
        const coverageTrigger = policy.coverageTriggers.find(ct => ct.type === trigger.type);
        const maxPayoutPct = coverageTrigger?.maxPayoutPercent || 70;
        const claimAmount = Math.round(policy.coverageAmount * (maxPayoutPct / 100) * mult);

        const claim = await Claim.create({
          workerId: policy.workerId._id,
          policyId: policy._id,
          triggerType: trigger.type,
          triggerDescription: `Auto-triggered: ${trigger.type} detected in ${city}`,
          triggerData: {
            weatherCondition: weather.description,
            temperature: weather.temp,
            rainfall: weather.rainfall,
            windSpeed: weather.windSpeed,
            aqiIndex: weather.aqi,
            sourceApi: weather.source,
            rawData: weather
          },
          disruptionStartDate: new Date(),
          estimatedLoss: claimAmount * 1.2,
          claimAmount,
          location: {
            city,
            latitude: policy.workerId.latitude,
            longitude: policy.workerId.longitude
          },
          status: 'auto_triggered',
          isAutoTriggered: true,
          payoutMethod: policy.workerId.upiId ? 'upi' : 'bank_transfer'
        });

        // Fraud check
        const fraudResult = await analyzeClaim(claim, policy.workerId, policy, weatherEvent);
        claim.fraudScore = fraudResult.fraudScore;
        claim.fraudFlags = fraudResult.fraudFlags;
        claim.isFraudulent = fraudResult.isFraudulent;

        if (fraudResult.isFraudulent) {
          claim.status = 'fraud_flagged';
        } else if (fraudResult.recommendation === 'approve') {
          claim.status = 'approved';
          claim.approvedAmount = claimAmount;
          claim.payoutStatus = 'processing';
        } else {
          claim.status = 'under_review';
        }

        await claim.save();

        // Update weather event
        if (weatherEvent) {
          weatherEvent.claimsTriggered = (weatherEvent.claimsTriggered || 0) + 1;
          await weatherEvent.save();
        }

        // Notify worker
        await Notification.create({
          workerId: policy.workerId._id,
          title: '🚨 Disruption Alert - Claim Triggered',
          message: `We detected ${trigger.type.replace(/_/g, ' ')} in ${city}. A claim of ₹${claimAmount} has been auto-triggered for you.`,
          type: 'claim_triggered',
          priority: 'high',
          data: { claimId: claim._id, claimNumber: claim.claimNumber, amount: claimAmount }
        });

        totalTriggered++;
      }
    }
  }

  logger.info(`Auto-triggered ${totalTriggered} claims`);
  return totalTriggered;
};

module.exports = { autoTriggerClaims };
