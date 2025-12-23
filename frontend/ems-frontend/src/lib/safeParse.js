/**
 * SafeParse Utility
 * Safely parses JSON from localStorage and handles corrupted data
 */

/**
 * Safely parse a user object from localStorage
 * @param {string} key - The localStorage key
 * @returns {object|null} - Parsed user object or null if invalid
 */
export function safeParseUser(key = 'user') {
  try {
    const stored = localStorage.getItem(key);

    // Check for common corrupted values
    if (!stored || stored === 'undefined' || stored === 'null') {
      return null;
    }

    const parsed = JSON.parse(stored);

    // Validate the parsed object has required properties
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    // Validate required user properties
    if (!parsed.userID || !parsed.role) {
      return null;
    }

    return parsed;
  } catch (error) {
    // JSON parsing failed
    console.error('Failed to parse user data from localStorage:', error);
    return null;
  }
}

/**
 * Safely get a value from localStorage
 * @param {string} key - The localStorage key
 * @returns {string|null} - The value or null if invalid
 */
export function safeGetItem(key) {
  const value = localStorage.getItem(key);

  // Check for corrupted values
  if (!value || value === 'undefined' || value === 'null') {
    return null;
  }

  return value;
}

/**
 * Clear all auth data from localStorage
 */
export function clearAuthData() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  // Legacy cleanup
  localStorage.removeItem('userRole');
}
