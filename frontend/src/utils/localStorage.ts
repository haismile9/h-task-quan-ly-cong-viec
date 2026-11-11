/**
 * Safely parse JSON from localStorage
 * @param key - localStorage key
 * @param defaultValue - default value if parsing fails
 * @returns parsed value or defaultValue
 */
export const getLocalStorageItem = <T>(key: string, defaultValue: T = null as T): T => {
  try {
    const item = localStorage.getItem(key);
    if (item === null || item === "undefined" || item === "null") {
      return defaultValue;
    }
    return JSON.parse(item);
  } catch (error) {
    console.error(`Error parsing localStorage item "${key}":`, error);
    // Remove corrupted item
    localStorage.removeItem(key);
    return defaultValue;
  }
};

/**
 * Safely set item to localStorage
 * @param key - localStorage key
 * @param value - value to store
 */
export const setLocalStorageItem = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting localStorage item "${key}":`, error);
  }
};

/**
 * Remove item from localStorage
 * @param key - localStorage key
 */
export const removeLocalStorageItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing localStorage item "${key}":`, error);
  }
};
