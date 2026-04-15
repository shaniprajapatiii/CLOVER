const isLikelyJson = (contentType = '') => contentType.toLowerCase().includes('application/json');

const toMessage = (payload, fallback) => {
  if (!payload) return fallback;
  if (typeof payload === 'string') return payload;
  return payload.message || payload.error || fallback;
};

export const apiFetch = async (url, options = {}, fallbackMessage = 'Request failed') => {
  try {
    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type') || '';
    let payload = null;

    if (isLikelyJson(contentType)) {
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }
    } else {
      const text = await response.text();
      if (text) {
        try {
          payload = JSON.parse(text);
        } catch {
          payload = text;
        }
      }
    }

    if (!response.ok) {
      const error = new Error(toMessage(payload, `${fallbackMessage} (HTTP ${response.status})`));
      error.status = response.status;
      error.payload = payload;
      throw error;
    }

    return payload || {};
  } catch (error) {
    if (error instanceof TypeError) {
      if (import.meta.env.DEV) {
        console.warn('Network error while calling API:', url, error);
      }
      throw new Error('Unable to reach server. Check API URL, backend deployment, and CORS settings.');
    }
    throw error;
  }
};
