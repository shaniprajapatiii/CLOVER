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

export const API_BASE = envBase || 'http://localhost:4000/api';
