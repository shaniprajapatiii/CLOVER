import React from 'react';
import { Link } from 'react-router-dom';
import { FiCompass } from 'react-icons/fi';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      <div className="max-w-xl w-full card text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-500/15 border border-brand-500/35 flex items-center justify-center">
          <FiCompass className="text-3xl text-brand-300" />
        </div>
        <h1 className="font-display text-4xl font-bold text-white">Page Not Found</h1>
        <p className="text-gray-400 mt-3">The page you requested does not exist or may have moved.</p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="btn-secondary">Go To Home</Link>
          <Link to="/dashboard" className="btn-primary">Open Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
