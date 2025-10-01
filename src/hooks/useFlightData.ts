'use client';

import { useState, useEffect, useCallback } from 'react';
import { Flight } from '@/lib/flightaware';
import { 
  getCacheKey, 
  getFromCache, 
  saveToCache, 
  isCacheValid, 
  isCacheStale,
  cleanExpiredCache,
  CacheEntry,
  FlightCacheKey 
} from '@/lib/cache';

interface FlightDataState {
  departures: Flight[];
  arrivals: Flight[];
  loading: boolean;
  error: string | null;
  cacheStatus: {
    departures: 'fresh' | 'stale' | 'none';
    arrivals: 'fresh' | 'stale' | 'none';
  };
}

interface UseFlightDataReturn extends FlightDataState {
  fetchFlights: (date: string, airport?: string) => Promise<void>;
  clearCache: () => void;
}

export function useFlightData(): UseFlightDataReturn {
  const [state, setState] = useState<FlightDataState>({
    departures: [],
    arrivals: [],
    loading: false,
    error: null,
    cacheStatus: {
      departures: 'none',
      arrivals: 'none',
    },
  });

  // Clean expired cache on mount
  useEffect(() => {
    cleanExpiredCache();
  }, []);

  const fetchFlights = useCallback(async (date: string, airport: string = 'BWN') => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Check cache for both departures and arrivals
      const departuresKey = getCacheKey({ airport, date, type: 'departures' });
      const arrivalsKey = getCacheKey({ airport, date, type: 'arrivals' });

      const cachedDepartures = getFromCache<Flight[]>(departuresKey);
      const cachedArrivals = getFromCache<Flight[]>(arrivalsKey);

      // Determine cache status
      const departuresStatus = cachedDepartures 
        ? (isCacheValid(cachedDepartures) ? 'fresh' : (isCacheStale(cachedDepartures) ? 'stale' : 'none'))
        : 'none';
      
      const arrivalsStatus = cachedArrivals 
        ? (isCacheValid(cachedArrivals) ? 'fresh' : (isCacheStale(cachedArrivals) ? 'stale' : 'none'))
        : 'none';

      // If we have fresh cache, use it immediately
      if (departuresStatus === 'fresh' && arrivalsStatus === 'fresh') {
        setState(prev => ({
          ...prev,
          departures: cachedDepartures!.data,
          arrivals: cachedArrivals!.data,
          loading: false,
          cacheStatus: {
            departures: 'fresh',
            arrivals: 'fresh',
          },
        }));
        return;
      }

      // If we have stale cache, show it while fetching fresh data
      if (departuresStatus === 'stale' || arrivalsStatus === 'stale') {
        setState(prev => ({
          ...prev,
          departures: cachedDepartures?.data || [],
          arrivals: cachedArrivals?.data || [],
          cacheStatus: {
            departures: departuresStatus,
            arrivals: arrivalsStatus,
          },
        }));
      }

      // Fetch fresh data for stale or missing cache
      const fetchPromises: Promise<any>[] = [];
      
      if (departuresStatus !== 'fresh') {
        fetchPromises.push(
          fetch(`/api/departures?date=${date}&airport=${airport}`)
            .then(res => res.json())
            .then(data => {
              const flights = data.flights || [];
              saveToCache(departuresKey, flights);
              return { type: 'departures', data: flights };
            })
        );
      }

      if (arrivalsStatus !== 'fresh') {
        fetchPromises.push(
          fetch(`/api/arrivals?date=${date}&airport=${airport}`)
            .then(res => res.json())
            .then(data => {
              const flights = data.flights || [];
              saveToCache(arrivalsKey, flights);
              return { type: 'arrivals', data: flights };
            })
        );
      }

      if (fetchPromises.length > 0) {
        const results = await Promise.all(fetchPromises);
        
        const newDepartures = results.find(r => r.type === 'departures')?.data || state.departures;
        const newArrivals = results.find(r => r.type === 'arrivals')?.data || state.arrivals;

        setState(prev => ({
          ...prev,
          departures: newDepartures,
          arrivals: newArrivals,
          loading: false,
          cacheStatus: {
            departures: 'fresh',
            arrivals: 'fresh',
          },
        }));
      } else {
        // All data was fresh, just update loading state
        setState(prev => ({ ...prev, loading: false }));
      }

    } catch (error) {
      console.error('Error fetching flights:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      }));
    }
  }, [state.departures]);

  const clearCache = useCallback(() => {
    // Clear localStorage cache
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('flightdata_')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    setState(prev => ({
      ...prev,
      cacheStatus: {
        departures: 'none',
        arrivals: 'none',
      },
    }));
    
    console.log(`Cleared ${keysToRemove.length} cache entries`);
  }, []);

  return {
    ...state,
    fetchFlights,
    clearCache,
  };
}
