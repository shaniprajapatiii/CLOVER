const normalizeApiBase = (value) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';

  // Vercel deployments are served over HTTPS; force secure protocol for API base.
  if (trimmed.startsWith('http://') && trimmed.includes('.vercel.app')) {
    return trimmed.replace('http://', 'https://');
  }

  return trimmed;
};

const envBase = normalizeApiBase(import.meta.env.VITE_API_URL);
const isLocalDev = typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
const defaultProdBase = 'https://clover-ruby.vercel.app/api';

export const API_BASE = envBase || (isLocalDev ? 'http://localhost:4000/api' : defaultProdBase);
