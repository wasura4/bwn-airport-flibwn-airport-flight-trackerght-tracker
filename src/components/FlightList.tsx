'use client';

import { Flight } from '@/lib/flightaware';
import FlightCard from './FlightCard';

interface FlightListProps {
  flights: Flight[];
  type: 'departure' | 'arrival';
  loading: boolean;
  error: string | null;
}

export default function FlightList({ flights, type, loading, error }: FlightListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                <div>
                  <div className="h-5 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
              <div className="text-right">
                <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-16 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-8"></div>
                <div className="h-16 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-12"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="card text-center py-12">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-apple-dark-gray mb-2">
          Unable to load flights
        </h3>
        <p className="text-apple-light-gray">
          {error}
        </p>
      </div>
    );
  }

  if (flights.length === 0) {
    return (
      <div className="card text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No {type}s found
        </h3>
        <p className="text-gray-500 mb-4">
          No flights {type === 'departure' ? 'departing from' : 'arriving at'} BWN airport for the selected date.
        </p>
        <div className="text-sm text-gray-400 space-y-1">
          <p>• Check if the date is in the future (limited data available)</p>
          <p>• Try selecting a recent past date</p>
          <p>• BWN airport may have limited scheduled flights</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {flights.map((flight) => (
        <FlightCard key={flight.fa_flight_id} flight={flight} type={type} />
      ))}
    </div>
  );
}
