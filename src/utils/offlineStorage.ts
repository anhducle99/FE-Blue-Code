import { fileSystem } from "./fileSystem";
import { isNative } from "../services/nativeService";

const STORAGE_KEY_PREFIX = "offline_cache_";
const CACHE_EXPIRY = 24 * 60 * 60 * 1000;
interface CachedData<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class OfflineStorageService {
  async set<T>(
    key: string,
    data: T,
    expiryMs: number = CACHE_EXPIRY
  ): Promise<void> {
    const cacheData: CachedData<T> = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + expiryMs,
    };

    if (isNative()) {
      try {
        await fileSystem.saveJSON(
          `${STORAGE_KEY_PREFIX}${key}.json`,
          cacheData
        );
      } catch (error) {
        console.error("Failed to cache data on native:", error);
        this.setLocalStorage(key, cacheData);
      }
    } else {
      this.setLocalStorage(key, cacheData);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    let cacheData: CachedData<T> | null = null;

    if (isNative()) {
      try {
        cacheData = await fileSystem.readJSON<CachedData<T>>(
          `${STORAGE_KEY_PREFIX}${key}.json`
        );
      } catch (error) {
        cacheData = this.getLocalStorage<T>(key);
      }
    } else {
      cacheData = this.getLocalStorage<T>(key);
    }

    if (!cacheData) {
      return null;
    }

    if (Date.now() > cacheData.expiry) {
      await this.remove(key);
      return null;
    }

    return cacheData.data;
  }

  async remove(key: string): Promise<void> {
    if (isNative()) {
      try {
        await fileSystem.delete(`${STORAGE_KEY_PREFIX}${key}.json`);
      } catch (error) {
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}${key}`);
      }
    } else {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${key}`);
    }
  }

  async clear(): Promise<void> {
    if (isNative()) {
      try {
        this.clearLocalStorage();
      } catch (error) {
        console.error("Failed to clear cache:", error);
      }
    } else {
      this.clearLocalStorage();
    }
  }

  async has(key: string): Promise<boolean> {
    const data = await this.get(key);
    return data !== null;
  }

  async getAllKeys(): Promise<string[]> {
    if (isNative()) {
      return this.getLocalStorageKeys();
    } else {
      return this.getLocalStorageKeys();
    }
  }

  private setLocalStorage<T>(key: string, data: CachedData<T>): void {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${key}`, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to set localStorage:", error);
    }
  }

  private getLocalStorage<T>(key: string): CachedData<T> | null {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${key}`);
      if (!stored) return null;
      return JSON.parse(stored) as CachedData<T>;
    } catch (error) {
      console.error("Failed to get localStorage:", error);
      return null;
    }
  }

  private clearLocalStorage(): void {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(STORAGE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }

  private getLocalStorageKeys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
        keys.push(key.replace(STORAGE_KEY_PREFIX, "").replace(".json", ""));
      }
    }
    return keys;
  }
}

export const offlineStorage = new OfflineStorageService();

export async function cacheDepartments(departments: any[]): Promise<void> {
  await offlineStorage.set("departments", departments);
}

export async function getCachedDepartments(): Promise<any[] | null> {
  return await offlineStorage.get<any[]>("departments");
}

export async function cacheSupportContacts(contacts: any[]): Promise<void> {
  await offlineStorage.set("supportContacts", contacts);
}

export async function getCachedSupportContacts(): Promise<any[] | null> {
  return await offlineStorage.get<any[]>("supportContacts");
}

export async function cacheUserData(user: any): Promise<void> {
  await offlineStorage.set("user", user);
}

export async function getCachedUserData(): Promise<any | null> {
  return await offlineStorage.get<any>("user");
}
