import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const STATS = [
  { label: 'Gig Workers Protected', value: '2.4L+' },
  { label: 'Claims Paid Out', value: '₹4.8Cr+' },
  { label: 'Avg Payout Time', value: '< 2hrs' },
  { label: 'Cities Covered', value: '28+' },
];

const FEATURES = [
  { icon: '🤖', title: 'AI Risk Assessment', desc: 'Dynamic weekly premiums calculated using ML models trained on 50+ risk factors including weather history, city risk, and work patterns.' },
  { icon: '⚡', title: 'Auto-Triggered Claims', desc: 'No paperwork. When our sensors detect extreme heat, flooding, or AQI spikes in your city, claims are triggered automatically.' },
  { icon: '🛡️', title: 'Fraud Detection', desc: 'Multi-layer AI fraud detection analyzes location, history, and event data to protect the pool from bad actors.' },
  { icon: '💸', title: 'Instant UPI Payouts', desc: 'Approved claims are transferred to your UPI/bank account within 2 hours — often before you finish your next delivery.' },
  { icon: '📊', title: 'Income Analytics', desc: 'Track your earnings protection, risk score trends, and payout history on a beautifully designed dashboard.' },
  { icon: '🌦️', title: 'Real-time Weather Alerts', desc: 'Get notified before disruptions hit. Know when your city is under a weather alert so you can plan your day.' },
];

const PLATFORMS = ['Zomato', 'Swiggy', 'Zepto', 'Blinkit', 'Amazon', 'Flipkart', 'Dunzo'];

const HOW_IT_WORKS = [
  { step: '01', title: 'Sign Up in 2 Minutes', desc: 'Register with your phone number, select your delivery platform, and complete basic KYC.' },
  { step: '02', title: 'Get Your Risk Profile', desc: 'Our AI analyzes your city, platform, vehicle, and work pattern to calculate your personalized weekly premium.' },
  { step: '03', title: 'Choose Your Plan', desc: 'Pick Basic (₹49/wk), Standard (₹89/wk), or Premium (₹139/wk). Pay weekly, cancel anytime.' },
  { step: '04', title: 'Get Protected & Paid', desc: 'When a disruption is detected, your claim is auto-triggered and money is in your account within 2 hours.' },
];

export default function LandingPage() {
  const [activePlatform, setActivePlatform] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActivePlatform(p => (p + 1) % PLATFORMS.length), 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-dark-900 overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-900/80 backdrop-blur-xl border-b border-dark-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-sm font-bold">G</div>
            <span className="font-display text-xl font-bold text-white">GigShield</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-ghost text-sm">Sign In</Link>
            <Link to="/register" className="btn-primary text-sm py-2 px-4">Get Protected</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-4 relative">
        <div className="absolute inset-0 bg-hero-pattern opacity-30 pointer-events-none" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-96 h-96 bg-brand-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/30 rounded-full px-4 py-2 text-sm text-brand-400 font-medium mb-8">
            <span className="w-2 h-2 bg-brand-400 rounded-full animate-pulse" />
            Now covering {activePlatform !== undefined ? PLATFORMS[activePlatform] : 'Zomato'} delivery partners
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
            India's First<br />
            <span className="gradient-text">AI Insurance</span><br />
            for Gig Workers
          </h1>

          <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Extreme heat, floods, pollution — when disruptions stop your deliveries, GigShield automatically pays you within 2 hours. No claim forms. No waiting.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn-primary text-base py-4 px-8 text-center">
              Start from ₹49/week →
            </Link>
            <Link to="/login" className="btn-secondary text-base py-4 px-8 text-center">
              Sign In to Dashboard
            </Link>
          </div>

          <p className="text-gray-600 text-sm mt-4">No paperwork · Cancel anytime · UPI payout</p>
        </div>

        {/* Stats row */}
        <div className="max-w-4xl mx-auto mt-20 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <div key={s.label} className="card text-center">
              <div className="font-display text-2xl font-bold gradient-text">{s.value}</div>
              <div className="text-gray-500 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Platforms */}
      <section className="py-12 border-y border-dark-700 bg-dark-800/40">
        <div className="max-w-5xl mx-auto px-4">
          <p className="text-center text-gray-500 text-sm mb-6 uppercase tracking-widest font-medium">Coverage for workers on</p>
          <div className="flex flex-wrap justify-center gap-4">
            {PLATFORMS.map((p, i) => (
              <div key={p} className={`px-5 py-2.5 rounded-xl border font-semibold text-sm transition-all duration-300 ${i === activePlatform ? 'border-brand-500 bg-brand-500/15 text-brand-400' : 'border-dark-600 bg-dark-700 text-gray-400'}`}>
                {p}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-white mb-4">Built for the realities of gig work</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">Every feature was designed specifically for delivery partners who work outside in India's unpredictable climate.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="card-hover group">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="font-display text-lg font-bold text-white mb-2 group-hover:text-brand-400 transition-colors">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4 bg-dark-800/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-white mb-4">How GigShield Works</h2>
            <p className="text-gray-400 text-lg">Simple. Fast. Automated.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((h, i) => (
              <div key={h.step} className="relative">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-brand-500/40 to-transparent z-10" />
                )}
                <div className="card text-center">
                  <div className="font-mono text-brand-500 text-3xl font-bold mb-3">{h.step}</div>
                  <h3 className="font-semibold text-white mb-2">{h.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{h.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-white mb-4">Simple weekly pricing</h2>
            <p className="text-gray-400">Pay week by week. Just like you earn.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { name: 'Basic Shield', price: '₹49', coverage: '₹1,800', triggers: 3, color: 'border-dark-600', badge: '' },
              { name: 'Standard Shield', price: '₹89', coverage: '₹2,800', triggers: 6, color: 'border-brand-500', badge: 'Most Popular' },
              { name: 'Premium Shield', price: '₹139', coverage: '₹4,000', triggers: 11, color: 'border-dark-600', badge: '' },
            ].map((plan) => (
              <div key={plan.name} className={`card border-2 ${plan.color} relative`}>
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 badge-orange text-xs">{plan.badge}</div>
                )}
                <h3 className="font-display font-bold text-white mb-1">{plan.name}</h3>
                <div className="font-display text-3xl font-bold gradient-text mb-1">{plan.price}<span className="text-gray-500 text-base font-normal">/week</span></div>
                <div className="text-gray-400 text-sm mb-4">Up to {plan.coverage} coverage</div>
                <div className="text-brand-400 text-sm font-medium">{plan.triggers} disruption types covered</div>
                <Link to="/register" className="btn-primary w-full text-center mt-4 block text-sm py-2.5">Get Started →</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="card border-brand-500/30 bg-gradient-to-b from-brand-500/5 to-transparent">
            <div className="text-5xl mb-4">🛡️</div>
            <h2 className="font-display text-4xl font-bold text-white mb-4">Don't work unprotected</h2>
            <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">Every day you work without coverage is a day a single storm can erase your week's income. Join 2.4 lakh+ gig workers who've chosen to protect themselves.</p>
            <Link to="/register" className="btn-primary text-base py-4 px-10 inline-block">
              Get Protected — Starting ₹49/week
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-700 py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-500 rounded flex items-center justify-center text-xs font-bold">G</div>
            <span className="font-display font-bold text-white">GigShield</span>
          </div>
          <p className="text-gray-600 text-sm">© 2025 GigShield. AI-Powered Parametric Insurance for India's Gig Economy.</p>
          <div className="flex gap-6 text-gray-500 text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
