export const safeGetItem = (key) => {
  try {
    const raw = localStorage?.getItem?.(key);
    if (!raw || raw === 'undefined') return null;
    return raw;
  } catch (err) {
    console.warn('safeGetItem error', err);
    return null;
  }
};

export const safeParseUser = () => {
  const raw = safeGetItem('user');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.id && !parsed.userID) {
      parsed.userID = parsed.id;
    }
    return parsed;
  } catch (err) {
    console.warn('safeParseUser error', err);
    return null;
  }
};

export const clearAuthData = () => {
  try {
    localStorage?.removeItem?.('token');
    localStorage?.removeItem?.('userRole');
    localStorage?.removeItem?.('user');
  } catch (err) {
    console.warn('clearAuthData error', err);
  }
};
