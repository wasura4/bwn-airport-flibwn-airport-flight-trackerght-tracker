'use client';

import { useState, useEffect } from 'react';
import { Flight } from '@/lib/flightaware';
import Calendar from '@/components/Calendar';
import FlightList from '@/components/FlightList';

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  
  const [departures, setDepartures] = useState<Flight[]>([]);
  const [arrivals, setArrivals] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'departure' | 'arrival'>('departure');

  const fetchFlights = async (date: string) => {
    setLoading(true);
    setError(null);

    try {
      console.log('Fetching flights for date:', date);
      console.log('Date object:', new Date(date));
      
      const [departuresRes, arrivalsRes] = await Promise.all([
        fetch(`/api/departures?date=${date}&airport=BWN`),
        fetch(`/api/arrivals?date=${date}&airport=BWN`)
      ]);

      if (!departuresRes.ok || !arrivalsRes.ok) {
        const errorText = await departuresRes.text();
        console.error('API error:', { departuresRes: departuresRes.status, arrivalsRes: arrivalsRes.status, errorText });
        throw new Error(`Failed to fetch flight data: ${departuresRes.status} ${arrivalsRes.status}`);
      }

      const departuresData = await departuresRes.json();
      const arrivalsData = await arrivalsRes.json();

      console.log('Departures data:', departuresData);
      console.log('Arrivals data:', arrivalsData);

      setDepartures(departuresData.flights || []);
      setArrivals(arrivalsData.flights || []);
    } catch (err) {
      console.error('Error fetching flights:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setDepartures([]);
      setArrivals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlights(selectedDate);
  }, [selectedDate]);

  const currentFlights = activeTab === 'departure' ? departures : arrivals;

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-gray-100 to-gray-200">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
            BWN Airport
          </h1>
          <p className="text-xl text-gray-600">
            Brunei International Airport - Flight Departures & Arrivals
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex justify-center mb-8">
          <Calendar selectedDate={selectedDate} onDateChange={setSelectedDate} />
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100">
            <button
              onClick={() => setActiveTab('departure')}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                activeTab === 'departure'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Departures
            </button>
            <button
              onClick={() => setActiveTab('arrival')}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                activeTab === 'arrival'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Arrivals
            </button>
          </div>
        </div>

        {/* Flight Count */}
        <div className="text-center mb-6">
          <p className="text-gray-600">
            {loading ? 'Loading...' : `${currentFlights.length} ${activeTab}s found`}
          </p>
          {error && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                ⚠️ Unable to fetch flight data: {error}
              </p>
            </div>
          )}
        </div>

            {/* Flight List */}
            <div className="max-w-5xl mx-auto">
              <FlightList
                flights={currentFlights}
                type={activeTab}
                loading={loading}
                error={error}
              />
            </div>

        {/* Footer */}
        <footer className="mt-16 border-t border-gray-200 pt-8">
          <div className="text-center space-y-4">
            {/* COSMO School Branding */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: '#202959' }}>
                <span className="font-bold text-lg" style={{ color: '#FDD00F' }}>C</span>
              </div>
              <div className="text-left">
                <h3 className="font-bold text-gray-900 text-lg">COSMO School of Information Technology</h3>
                <p className="text-gray-600 text-sm">Empowering Future Innovators</p>
              </div>
            </div>

            {/* Data Source Info */}
            <div className="bg-gray-50 rounded-2xl p-6 max-w-md mx-auto">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700">Flight Data</span>
              </div>
              <p className="text-xs text-gray-600 mb-3">Real-time flight information provided by FlightAware</p>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Last updated:</span>
                <span className="font-medium">
                  {new Date().toLocaleTimeString('en-US', {
                    timeZone: 'Asia/Brunei',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })} BWN Time
                </span>
              </div>
            </div>

            {/* Copyright */}
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                © {new Date().getFullYear()} COSMO School of Information Technology. All rights reserved.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Built with Next.js, TypeScript & Tailwind CSS
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
