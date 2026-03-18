/**
 * AI Fraud Detection Engine
 * Analyzes claims for anomalies and fraudulent patterns
 */
const Claim = require('../models/Claim');

// Distance calculation (Haversine formula)
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

/**
 * Multi-factor fraud analysis
 */
const analyzeClaim = async (claim, worker, policy, weatherEvent) => {
  const flags = [];
  let fraudScore = 0;

  // 1. Duplicate claim detection (same trigger, same period)
  const duplicateClaim = await Claim.findOne({
    workerId: worker._id,
    triggerType: claim.triggerType,
    disruptionStartDate: {
      $gte: new Date(claim.disruptionStartDate.getTime() - 24 * 60 * 60 * 1000),
      $lte: new Date(claim.disruptionStartDate.getTime() + 24 * 60 * 60 * 1000)
    },
    _id: { $ne: claim._id },
    status: { $nin: ['rejected', 'fraud_flagged'] }
  });

  if (duplicateClaim) {
    fraudScore += 0.40;
    flags.push({ flag: 'duplicate_claim', score: 0.40, description: 'Duplicate claim for same event period', detectedAt: new Date() });
  }

  // 2. Location mismatch (worker registered city vs claim city)
  if (claim.location?.city && worker.city) {
    const claimCity = claim.location.city.toLowerCase().trim();
    const workerCity = worker.city.toLowerCase().trim();
    if (claimCity !== workerCity && !workerCity.includes(claimCity) && !claimCity.includes(workerCity)) {
      fraudScore += 0.25;
      flags.push({ flag: 'location_mismatch', score: 0.25, description: `Claim city (${claim.location.city}) differs from registered city (${worker.city})`, detectedAt: new Date() });
    }
  }

  // 3. High-frequency claims
  const recentClaimsCount = await Claim.countDocuments({
    workerId: worker._id,
    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    status: { $nin: ['rejected', 'fraud_flagged'] }
  });

  if (recentClaimsCount >= 6) {
    fraudScore += 0.20;
    flags.push({ flag: 'high_frequency', score: 0.20, description: `${recentClaimsCount} claims in 30 days`, detectedAt: new Date() });
  } else if (recentClaimsCount >= 4) {
    fraudScore += 0.10;
    flags.push({ flag: 'moderate_frequency', score: 0.10, description: `${recentClaimsCount} claims in 30 days`, detectedAt: new Date() });
  }

  // 4. Claim amount vs coverage limit
  if (claim.claimAmount > policy.coverageAmount) {
    fraudScore += 0.15;
    flags.push({ flag: 'excess_amount', score: 0.15, description: `Claim ₹${claim.claimAmount} exceeds coverage ₹${policy.coverageAmount}`, detectedAt: new Date() });
  }

  // 5. Worker fraud history
  if (worker.fraudFlags > 0) {
    const historyScore = Math.min(worker.fraudFlags * 0.10, 0.25);
    fraudScore += historyScore;
    flags.push({ flag: 'fraud_history', score: historyScore, description: `Worker has ${worker.fraudFlags} previous fraud flags`, detectedAt: new Date() });
  }

  // 6. Weather event correlation check
  if (weatherEvent) {
    // Verify weather event actually covers worker's location
    if (weatherEvent.city && worker.city) {
      const cityMatch = weatherEvent.city.toLowerCase().includes(worker.city.toLowerCase()) ||
                        worker.city.toLowerCase().includes(weatherEvent.city.toLowerCase());
      if (!cityMatch) {
        fraudScore += 0.20;
        flags.push({ flag: 'weather_location_mismatch', score: 0.20, description: 'Weather event does not cover worker location', detectedAt: new Date() });
      }
    }
    // Verify severity matches claim type
    if (weatherEvent.severity === 'low' && claim.triggerType !== 'platform_outage') {
      fraudScore += 0.10;
      flags.push({ flag: 'low_severity_event', score: 0.10, description: 'Weather event severity too low to trigger income loss', detectedAt: new Date() });
    }
  } else {
    // No weather event found - suspicious for weather claims
    if (['extreme_heat', 'heavy_rain', 'flood', 'severe_pollution', 'cyclone'].includes(claim.triggerType)) {
      fraudScore += 0.15;
      flags.push({ flag: 'no_weather_event', score: 0.15, description: 'No verified weather event found for claim date/location', detectedAt: new Date() });
    }
  }

  // 7. New policy - quick claim
  const policyAge = (new Date() - new Date(policy.startDate)) / (1000 * 60 * 60 * 24);
  if (policyAge < 3) {
    fraudScore += 0.15;
    flags.push({ flag: 'new_policy_claim', score: 0.15, description: `Policy only ${Math.round(policyAge)} days old`, detectedAt: new Date() });
  }

  // Clamp score
  fraudScore = Math.min(fraudScore, 1.0);

  return {
    fraudScore: parseFloat(fraudScore.toFixed(3)),
    fraudFlags: flags,
    isFraudulent: fraudScore >= (parseFloat(process.env.FRAUD_SCORE_THRESHOLD) || 0.75),
    recommendation: fraudScore >= 0.75 ? 'reject' : fraudScore >= 0.50 ? 'manual_review' : 'approve'
  };
};

module.exports = { analyzeClaim };
