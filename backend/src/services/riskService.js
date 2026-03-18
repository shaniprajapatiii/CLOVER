/**
 * AI-Powered Risk Assessment Engine
 * Calculates risk scores and weekly premiums for gig workers
 */

const CITY_RISK_MULTIPLIERS = {
  mumbai: 1.35,    // High flooding, coastal
  delhi: 1.30,     // High pollution, extreme heat
  bangalore: 1.10,
  chennai: 1.25,   // Cyclones, flooding
  kolkata: 1.20,   // Flooding, cyclones
  hyderabad: 1.15,
  pune: 1.10,
  ahmedabad: 1.25, // Extreme heat
  jaipur: 1.20,    // Extreme heat
  lucknow: 1.15,
  default: 1.10
};

const PLATFORM_RISK_ADJUSTMENTS = {
  zomato: 0.0,
  swiggy: 0.0,
  zepto: -0.05,    // Shorter distances
  blinkit: -0.05,
  amazon: 0.05,    // Longer routes
  flipkart: 0.05,
  dunzo: -0.02,
  other: 0.0
};

const VEHICLE_RISK_ADJUSTMENTS = {
  bicycle: 0.10,       // More weather-exposed
  motorcycle: 0.05,
  scooter: 0.05,
  electric_scooter: 0.03,
  car: -0.10           // Most protected
};

const SEGMENT_BASE_PREMIUMS = {
  food: { basic: 49, standard: 89, premium: 139 },
  ecommerce: { basic: 59, standard: 99, premium: 149 },
  grocery_qcommerce: { basic: 44, standard: 79, premium: 129 }
};

const PLAN_COVERAGE_MULTIPLIERS = {
  basic: { coverage: 0.5, triggers: ['extreme_heat', 'heavy_rain', 'severe_pollution'] },
  standard: { coverage: 0.7, triggers: ['extreme_heat', 'heavy_rain', 'severe_pollution', 'flood', 'curfew', 'strike'] },
  premium: { coverage: 0.9, triggers: ['extreme_heat', 'heavy_rain', 'severe_pollution', 'flood', 'curfew', 'strike', 'platform_outage', 'cyclone', 'hailstorm', 'dense_fog', 'cold_wave'] }
};

/**
 * Calculate risk score (0-1) for a worker
 */
const calculateRiskScore = (workerData) => {
  const {
    city, platform, vehicleType, deliverySegment,
    averageDailyHours, workingDaysPerWeek, experienceMonths,
    totalClaimsCount, fraudFlags
  } = workerData;

  let riskScore = 0.5; // Base
  const riskFactors = [];

  // City risk
  const cityKey = city?.toLowerCase().replace(/\s/g, '');
  const cityMultiplier = CITY_RISK_MULTIPLIERS[cityKey] || CITY_RISK_MULTIPLIERS.default;
  const cityRisk = (cityMultiplier - 1.0) * 0.5;
  riskScore += cityRisk;
  riskFactors.push({ factor: 'city_exposure', weight: cityRisk, description: `High-risk city: ${city}` });

  // Vehicle exposure
  const vehicleAdj = VEHICLE_RISK_ADJUSTMENTS[vehicleType] || 0;
  riskScore += vehicleAdj;
  riskFactors.push({ factor: 'vehicle_type', weight: vehicleAdj, description: `Vehicle: ${vehicleType}` });

  // Work hours (more hours = more exposure)
  const hoursRisk = ((averageDailyHours || 8) - 6) * 0.02;
  riskScore += Math.min(hoursRisk, 0.1);
  riskFactors.push({ factor: 'work_hours', weight: hoursRisk, description: `Daily hours: ${averageDailyHours}` });

  // Experience (less experience = higher risk)
  const expRisk = experienceMonths < 3 ? 0.10 : experienceMonths < 12 ? 0.05 : -0.05;
  riskScore += expRisk;
  riskFactors.push({ factor: 'experience', weight: expRisk, description: `${experienceMonths} months experience` });

  // Historical claims
  if (totalClaimsCount > 5) {
    riskScore += 0.10;
    riskFactors.push({ factor: 'claim_history', weight: 0.10, description: 'High claim frequency' });
  }

  // Fraud flags
  if (fraudFlags > 0) {
    riskScore += fraudFlags * 0.15;
    riskFactors.push({ factor: 'fraud_flags', weight: fraudFlags * 0.15, description: `${fraudFlags} fraud flags` });
  }

  // Clamp between 0.1 and 0.95
  riskScore = Math.min(Math.max(riskScore, 0.1), 0.95);

  const riskCategory = riskScore < 0.4 ? 'low' : riskScore < 0.65 ? 'medium' : 'high';

  return { riskScore: parseFloat(riskScore.toFixed(3)), riskCategory, riskFactors };
};

/**
 * Calculate weekly premium with full breakdown
 */
const calculateWeeklyPremium = (workerData, planType = 'standard') => {
  const { deliverySegment, city, platform, vehicleType, averageWeeklyEarnings, loyaltyPoints, referredBy } = workerData;

  const segment = deliverySegment || 'food';
  const basePremium = SEGMENT_BASE_PREMIUMS[segment]?.[planType] || SEGMENT_BASE_PREMIUMS.food.standard;

  // Risk loading
  const { riskScore } = calculateRiskScore(workerData);
  const riskLoading = basePremium * (riskScore - 0.5) * 0.4;

  // City adjustment
  const cityKey = city?.toLowerCase().replace(/\s/g, '');
  const cityMult = CITY_RISK_MULTIPLIERS[cityKey] || CITY_RISK_MULTIPLIERS.default;
  const cityAdjustment = basePremium * (cityMult - 1.0) * 0.3;

  // Platform adjustment
  const platformAdj = PLATFORM_RISK_ADJUSTMENTS[platform] || 0;
  const platformAdjustment = basePremium * platformAdj;

  // Loyalty discount
  const loyaltyDiscount = loyaltyPoints > 500 ? basePremium * 0.10 :
                          loyaltyPoints > 200 ? basePremium * 0.05 : 0;

  // Referral discount
  const referralDiscount = referredBy ? basePremium * 0.05 : 0;

  const finalPremium = Math.max(
    basePremium + riskLoading + cityAdjustment + platformAdjustment - loyaltyDiscount - referralDiscount,
    29 // minimum ₹29/week
  );

  // Coverage amount: % of weekly earnings
  const coveragePct = PLAN_COVERAGE_MULTIPLIERS[planType].coverage;
  const coverageAmount = Math.round((averageWeeklyEarnings || 3500) * coveragePct);

  return {
    basePremium: Math.round(basePremium),
    riskLoading: Math.round(riskLoading),
    cityAdjustment: Math.round(cityAdjustment),
    platformAdjustment: Math.round(platformAdjustment),
    loyaltyDiscount: Math.round(loyaltyDiscount),
    referralDiscount: Math.round(referralDiscount),
    finalPremium: Math.round(finalPremium),
    coverageAmount,
    coverageTriggers: PLAN_COVERAGE_MULTIPLIERS[planType].triggers
  };
};

/**
 * Get all 3 plan options for a worker
 */
const getAllPlanOptions = (workerData) => {
  return {
    basic: calculateWeeklyPremium(workerData, 'basic'),
    standard: calculateWeeklyPremium(workerData, 'standard'),
    premium: calculateWeeklyPremium(workerData, 'premium')
  };
};

module.exports = { calculateRiskScore, calculateWeeklyPremium, getAllPlanOptions, PLAN_COVERAGE_MULTIPLIERS };
