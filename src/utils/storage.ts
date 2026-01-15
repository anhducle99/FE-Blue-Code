const STORAGE_PREFIX = "bluecode_";

export const storage = {
  get: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
      if (!item) return null;
      return JSON.parse(item) as T;
    } catch {
      return null;
    }
  },

  set: <T>(key: string, value: T): boolean => {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  remove: (key: string): boolean => {
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
      return true;
    } catch {
      return false;
    }
  },

  clear: (): void => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch {}
  },
};

export const legacyStorage = {
  get: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      if (!item) {
        if (process.env.NODE_ENV === "development") {
        }
        return null;
      }

      if (key === "token") {
        if (process.env.NODE_ENV === "development") {
         
        }
        return item as T;
      }

      try {
        const parsed = JSON.parse(item) as T;
        if (process.env.NODE_ENV === "development") {
         
        }
        return parsed;
      } catch (parseError) {
        if (process.env.NODE_ENV === "development") {
        
        }
        return item as T;
      }
    } catch (error) {
      console.error(`Error getting "${key}" from localStorage:`, error);
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
    } catch {
      return false;
    }
  },

  remove: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },
};
