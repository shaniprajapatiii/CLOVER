import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { FiTrendingUp, FiCpu, FiZap, FiShield, FiBarChart2, FiCloudRain, FiMapPin, FiUsers, FiLock, FiActivity, FiLayers, FiGlobe, FiGitBranch, FiAward, FiDatabase } from 'react-icons/fi';

const FUTURE_FEATURES = [
  {
    Icon: FiCpu,
    title: 'AI-Driven Personalized Pricing',
    desc: 'Next-gen ML models will personalize premiums in real time, factoring in live risk, earnings, and behavioral signals for every partner.'
  },
  {
    Icon: FiTrendingUp,
    title: 'Dynamic Risk Forecasting',
    desc: 'Integrate predictive analytics to forecast city-level disruption risk, using weather, traffic, and government data for proactive coverage.'
  },
  {
    Icon: FiZap,
    title: 'Instant Parametric Payouts',
    desc: 'Automated, API-driven payouts within minutes of verified disruption events, with zero manual claims or paperwork.'
  },
  {
    Icon: FiShield,
    title: 'Fraud Detection 2.0',
    desc: 'Advanced anomaly detection and zone-level ring fraud analytics, leveraging graph ML and behavioral scoring.'
  },
  {
    Icon: FiBarChart2,
    title: 'Partner Earnings Insights',
    desc: 'Deep analytics dashboards for partners to track earnings, risk, and coverage impact, powered by real-time data.'
  },
  {
    Icon: FiCloudRain,
    title: 'Hyperlocal Weather Triggers',
    desc: 'Pin-code level weather and AQI triggers, with ML-based anomaly detection for micro-zones.'
  },
  {
    Icon: FiMapPin,
    title: 'Nationwide Expansion',
    desc: 'Scale to 500+ cities, supporting all major gig platforms and regional languages.'
  },
  {
    Icon: FiUsers,
    title: 'Partner Community & Rewards',
    desc: 'Gamified rewards, community features, and referral bonuses to boost partner engagement and retention.'
  },
  {
    Icon: FiLock,
    title: 'Zero-Trust Data Security',
    desc: 'End-to-end encrypted data flows, with consent-based access and IRDAI-compliant privacy controls.'
  },
  {
    Icon: FiActivity,
    title: 'Real-Time Delivery Ops',
    desc: 'Live map tracking, instant order generation, and operational controls for partners, inspired by top delivery apps.'
  },
  {
    Icon: FiLayers,
    title: 'Modular API Integrations',
    desc: 'Plug-and-play APIs for partner platforms, enabling seamless onboarding, KYC, and payout flows.'
  },
  {
    Icon: FiGlobe,
    title: 'Global Expansion Ready',
    desc: 'Architecture designed for rapid internationalization and compliance with global microinsurance standards.'
  },
  {
    Icon: FiGitBranch,
    title: 'Open Innovation Platform',
    desc: 'Public APIs and SDKs for third-party developers to build on top of Clover’s insurance rails.'
  },
  {
    Icon: FiAward,
    title: 'Regulatory Sandboxes',
    desc: 'Continuous pilots with IRDAI and global regulators to launch new insurance products faster.'
  },
  {
    Icon: FiDatabase,
    title: 'Data-Driven Product Evolution',
    desc: 'Continuous learning from claims, partner feedback, and platform data to evolve coverage and pricing.'
  }
];


export default function FutureScope() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 text-white overflow-x-hidden">
      {/* Back button at the top */}
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-2 flex">
        <button
          onClick={() => navigate(-1)}
          className="btn-primary flex items-center gap-2 text-base py-2 px-6 rounded-full shadow-md hover:shadow-lg transition-all"
          style={{ zIndex: 20 }}
        >
          <FiArrowLeft className="text-lg" />
          Back
        </button>
      </div>
      <section className="pt-24 pb-20 px-4 relative">
        <div className="absolute inset-0 bg-hero-pattern opacity-20 pointer-events-none" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-96 h-96 bg-brand-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <h1 className="font-display text-5xl sm:text-6xl font-extrabold mb-6 gradient-text">CLOVER Future Scope</h1>
          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto mb-10">
            The journey has just begun. Here’s what’s next for CLOVER — a platform built to redefine gig worker protection, powered by AI, ML, and a vision for nationwide impact.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-32">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {FUTURE_FEATURES.map((f, i) => (
            <div key={f.title} className="card-hover group bg-dark-800/80 border border-brand-500/20 rounded-3xl p-7 shadow-xl transition-transform hover:-translate-y-2 hover:shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-brand-500/15 border border-brand-500/25 flex items-center justify-center mb-5 mx-auto">
                <f.Icon className="text-3xl text-brand-300" />
              </div>
              <h3 className="font-display text-xl font-bold mb-2 group-hover:text-brand-400 transition-colors text-center">{f.title}</h3>
              <p className="text-gray-300 text-sm leading-relaxed text-center">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <h2 className="font-display text-3xl font-bold mb-4 gradient-text">ML Model Architecture</h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-8">
            CLOVER’s ML engine powers risk scoring, fraud detection, and parametric triggers. Our roadmap includes:
          </p>
          <ul className="text-left max-w-2xl mx-auto text-gray-300 list-disc list-inside space-y-2">
            <li>Advanced fraud detection using behavioral, zone, and network analytics</li>
            <li>Dynamic risk multipliers that update with real-time city and platform data</li>
            <li>Automated payout triggers from government APIs (AQI, rainfall, cyclone, flood, curfew)</li>
            <li>Consent-based earnings verification via RBI Account Aggregator</li>
            <li>Interactive premium calculators and open APIs for partners</li>
            <li>Continuous learning from claims and partner feedback</li>
          </ul>
        </div>

        <div className="mt-20 text-center">
          <h2 className="font-display text-3xl font-bold mb-4 gradient-text">Clover Partner App Vision</h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-8">
            The Partner App will evolve into a full-stack gig protection suite:
          </p>
          <ul className="text-left max-w-2xl mx-auto text-gray-300 list-disc list-inside space-y-2">
            <li>Real-time delivery dashboard with live map, order generation, and instant earnings tracking</li>
            <li>Automated onboarding, KYC, and payout flows for partners</li>
            <li>Gamified rewards, community features, and referral programs</li>
            <li>Multi-language support and accessibility for all regions</li>
            <li>Plug-and-play APIs for platform integration</li>
          </ul>
        </div>

        <div className="mt-20 text-center">
          <h2 className="font-display text-3xl font-bold mb-4 gradient-text">A Platform Built for Scale</h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-8">
            CLOVER is designed for rapid growth, regulatory compliance, and open innovation. Join us as we build the future of gig insurance.
          </p>
        </div>
      </section>
    </div>
  );
}
