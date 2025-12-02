/**
 * Secure storage utilities
 * Provides a wrapper around localStorage with better error handling
 */

const STORAGE_PREFIX = "bluecode_";

export const storage = {
  /**
   * Get item from localStorage
   */
  get: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
      if (!item) return null;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Error reading from localStorage for key "${key}":`, error);
      return null;
    }
  },

  /**
   * Set item to localStorage
   */
  set: <T>(key: string, value: T): boolean => {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to localStorage for key "${key}":`, error);
      return false;
    }
  },

  /**
   * Remove item from localStorage
   */
  remove: (key: string): boolean => {
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
      return true;
    } catch (error) {
      console.error(
        `Error removing from localStorage for key "${key}":`,
        error
      );
      return false;
    }
  },

  /**
   * Clear all items with prefix
   */
  clear: (): void => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch {
      // Silently fail
    }
  },
};

/**
 * Legacy support for old localStorage keys (without prefix)
 * This allows backward compatibility
 */
export const legacyStorage = {
  get: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      // Try to parse as JSON first
      try {
        return JSON.parse(item) as T;
      } catch {
        if (typeof item === "string") {
          return item as T;
        }
        return null;
      }
    } catch (error) {
      console.error(`Error reading from localStorage for key "${key}":`, error);
      return null;
    }
  },

  set: <T>(key: string, value: T): boolean => {
    try {
      if (typeof value === "string") {
        localStorage.setItem(key, value);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
      return true;
    } catch (error) {
      console.error(`Error writing to localStorage for key "${key}":`, error);
      return false;
    }
  },

  remove: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(
        `Error removing from localStorage for key "${key}":`,
        error
      );
      return false;
    }
  },
};
