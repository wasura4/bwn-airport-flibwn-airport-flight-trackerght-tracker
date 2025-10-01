// Cache utility functions for flight data
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface FlightCacheKey {
  airport: string;
  date: string;
  type: 'departures' | 'arrivals';
}

const CACHE_PREFIX = 'flightdata_';
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
const STALE_WHILE_REVALIDATE = 60 * 60 * 1000; // 1 hour - serve stale data while fetching fresh

// Generate cache key
export function getCacheKey({ airport, date, type }: FlightCacheKey): string {
  return `${CACHE_PREFIX}${airport}_${date}_${type}`;
}

// Check if cache entry is valid
export function isCacheValid<T>(entry: CacheEntry<T> | null): boolean {
  if (!entry) return false;
  return Date.now() < entry.expiresAt;
}

// Check if cache entry is stale but can be served while revalidating
export function isCacheStale<T>(entry: CacheEntry<T> | null): boolean {
  if (!entry) return false;
  const now = Date.now();
  return now >= entry.expiresAt && now < entry.timestamp + STALE_WHILE_REVALIDATE;
}

// Get data from localStorage cache
export function getFromCache<T>(key: string): CacheEntry<T> | null {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const entry: CacheEntry<T> = JSON.parse(cached);
    return entry;
  } catch (error) {
    console.warn('Error reading from cache:', error);
    return null;
  }
}

// Save data to localStorage cache
export function saveToCache<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + CACHE_DURATION,
    };
    
    localStorage.setItem(key, JSON.stringify(entry));
    console.log(`Cached data for key: ${key}`);
  } catch (error) {
    console.warn('Error saving to cache:', error);
  }
}

// Clear expired cache entries
export function cleanExpiredCache(): void {
  try {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        const cached = localStorage.getItem(key);
        if (cached) {
          const entry = JSON.parse(cached);
          if (Date.now() >= entry.timestamp + STALE_WHILE_REVALIDATE) {
            keysToRemove.push(key);
          }
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    if (keysToRemove.length > 0) {
      console.log(`Cleaned ${keysToRemove.length} expired cache entries`);
    }
  } catch (error) {
    console.warn('Error cleaning cache:', error);
  }
}

// Clear all flight data cache
export function clearFlightCache(): void {
  try {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`Cleared ${keysToRemove.length} cache entries`);
  } catch (error) {
    console.warn('Error clearing cache:', error);
  }
}

// Get cache statistics
export function getCacheStats(): { total: number; valid: number; stale: number; expired: number } {
  let total = 0;
  let valid = 0;
  let stale = 0;
  let expired = 0;
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        const cached = localStorage.getItem(key);
        if (cached) {
          total++;
          const entry = JSON.parse(cached);
          
          if (isCacheValid(entry)) {
            valid++;
          } else if (isCacheStale(entry)) {
            stale++;
          } else {
            expired++;
          }
        }
      }
    }
  } catch (error) {
    console.warn('Error getting cache stats:', error);
  }
  
  return { total, valid, stale, expired };
}

// Format cache age for display
export function formatCacheAge(timestamp: number): string {
  const ageMs = Date.now() - timestamp;
  const ageMinutes = Math.floor(ageMs / (1000 * 60));
  
  if (ageMinutes < 1) return 'Just now';
  if (ageMinutes < 60) return `${ageMinutes}m ago`;
  
  const ageHours = Math.floor(ageMinutes / 60);
  if (ageHours < 24) return `${ageHours}h ago`;
  
  const ageDays = Math.floor(ageHours / 24);
  return `${ageDays}d ago`;
}
