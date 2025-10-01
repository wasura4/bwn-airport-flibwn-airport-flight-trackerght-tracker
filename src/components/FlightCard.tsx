'use client';

import { Flight, formatLocalTime, getStatusColor } from '@/lib/flightaware';
import { useMemo, useState } from 'react';

interface FlightCardProps {
  flight: Flight;
  type: 'departure' | 'arrival';
}

// Airline logo mapping (preferred overrides)
const getPreferredLogoMap = () => ({
  // Regional/common around BWN
  'BI': 'https://logos.skyscnr.com/images/airlines/favicon/BI.png', // Royal Brunei (IATA)
  'RBA': 'https://logos.skyscnr.com/images/airlines/favicon/BI.png', // Royal Brunei (ICAO -> map to BI)
  'AK': 'https://logos.skyscnr.com/images/airlines/favicon/AK.png', // AirAsia Malaysia (IATA)
  'AXM': 'https://logos.skyscnr.com/images/airlines/favicon/AK.png', // AirAsia Malaysia (ICAO -> map to AK)
  'FD': 'https://logos.skyscnr.com/images/airlines/favicon/FD.png', // Thai AirAsia
  'QZ': 'https://logos.skyscnr.com/images/airlines/favicon/QZ.png', // Indonesia AirAsia

  // Broad set of majors
    'MH': 'https://logos.skyscnr.com/images/airlines/favicon/MH.png', // Malaysia Airlines
    'SQ': 'https://logos.skyscnr.com/images/airlines/favicon/SQ.png', // Singapore Airlines
    'TG': 'https://logos.skyscnr.com/images/airlines/favicon/TG.png', // Thai Airways
    'CX': 'https://logos.skyscnr.com/images/airlines/favicon/CX.png', // Cathay Pacific
    'BR': 'https://logos.skyscnr.com/images/airlines/favicon/BR.png', // EVA Air
    'CI': 'https://logos.skyscnr.com/images/airlines/favicon/CI.png', // China Airlines
    'JL': 'https://logos.skyscnr.com/images/airlines/favicon/JL.png', // Japan Airlines
    'NH': 'https://logos.skyscnr.com/images/airlines/favicon/NH.png', // ANA
    'KE': 'https://logos.skyscnr.com/images/airlines/favicon/KE.png', // Korean Air
    'OZ': 'https://logos.skyscnr.com/images/airlines/favicon/OZ.png', // Asiana Airlines
    'QF': 'https://logos.skyscnr.com/images/airlines/favicon/QF.png', // Qantas
    'EK': 'https://logos.skyscnr.com/images/airlines/favicon/EK.png', // Emirates
    'QR': 'https://logos.skyscnr.com/images/airlines/favicon/QR.png', // Qatar Airways
    'EY': 'https://logos.skyscnr.com/images/airlines/favicon/EY.png', // Etihad
    'BA': 'https://logos.skyscnr.com/images/airlines/favicon/BA.png', // British Airways
    'LH': 'https://logos.skyscnr.com/images/airlines/favicon/LH.png', // Lufthansa
    'AF': 'https://logos.skyscnr.com/images/airlines/favicon/AF.png', // Air France
    'KL': 'https://logos.skyscnr.com/images/airlines/favicon/KL.png', // KLM
    'AC': 'https://logos.skyscnr.com/images/airlines/favicon/AC.png', // Air Canada
    'AA': 'https://logos.skyscnr.com/images/airlines/favicon/AA.png', // American Airlines
    'UA': 'https://logos.skyscnr.com/images/airlines/favicon/UA.png', // United Airlines
    'DL': 'https://logos.skyscnr.com/images/airlines/favicon/DL.png', // Delta
});

// Build ordered list of candidate logo URLs given various codes
const buildLogoCandidates = (params: {
  operator?: string;
  operatorIata?: string;
  operatorIcao?: string;
  ident?: string;
}) => {
  const { operator, operatorIata, operatorIcao, ident } = params;
  const preferred = getPreferredLogoMap();

  const codes: string[] = [];
  const iata = operatorIata?.toUpperCase();
  const icao = operatorIcao?.toUpperCase();
  const op = operator?.toUpperCase();
  const identPrefix = (ident || '').toUpperCase().match(/^[A-Z]{2,3}/)?.[0];

  [iata, icao, op, identPrefix].forEach((c) => {
    if (c && !codes.includes(c)) codes.push(c);
  });

  const candidates: string[] = [];
  // First, any preferred overrides
  codes.forEach((c) => {
    if (preferred[c]) candidates.push(preferred[c]);
  });
  // Then, generic Skyscanner favicon by code
  codes.forEach((c) => {
    const url = `https://logos.skyscnr.com/images/airlines/favicon/${c}.png`;
    if (!candidates.includes(url)) candidates.push(url);
  });

  return candidates;
};

// Get airline name from operator
const getAirlineName = (operator: string, operatorIata: string) => {
  const airlineNames: { [key: string]: string } = {
    'BI': 'Royal Brunei Airlines',
    'RBA': 'Royal Brunei Airlines',
    'AK': 'AirAsia',
    'AXM': 'AirAsia',
    'FD': 'Thai AirAsia',
    'QZ': 'Indonesia AirAsia',
    'MH': 'Malaysia Airlines',
    'SQ': 'Singapore Airlines',
    'TG': 'Thai Airways',
    'CX': 'Cathay Pacific',
    'BR': 'EVA Air',
    'CI': 'China Airlines',
    'JL': 'Japan Airlines',
    'NH': 'ANA',
    'KE': 'Korean Air',
    'OZ': 'Asiana Airlines',
    'QF': 'Qantas',
    'EK': 'Emirates',
    'QR': 'Qatar Airways',
    'EY': 'Etihad Airways',
    'BA': 'British Airways',
    'LH': 'Lufthansa',
    'AF': 'Air France',
    'KL': 'KLM Royal Dutch Airlines',
    'AC': 'Air Canada',
    'AA': 'American Airlines',
    'UA': 'United Airlines',
    'DL': 'Delta Air Lines',
  };
  
  const airlineCode = operatorIata || operator?.toUpperCase();
  return airlineNames[airlineCode] || operator || 'Unknown Airline';
};

export default function FlightCard({ flight, type }: FlightCardProps) {
  const isDeparture = type === 'departure';
  // For arrivals, we want to show the route as: FROM (origin) TO (destination = BWN)
  // For departures, we want to show the route as: FROM (origin = BWN) TO (destination)
  const origin = flight.origin;
  const destination = flight.destination;

  // Get airline information
  const airlineName = getAirlineName(flight.operator, flight.operator_iata);
  const logoCandidates = useMemo(
    () => buildLogoCandidates({
      operator: flight.operator,
      operatorIata: flight.operator_iata,
      operatorIcao: (flight as any).operator_icao,
      ident: flight.ident_iata || flight.ident,
    }),
    [flight]
  );
  const [logoIndex, setLogoIndex] = useState(0);
  const currentLogo = logoCandidates[logoIndex] || null;

  if (!origin || !destination) {
    console.error('Missing origin or destination data:', {
      flight: JSON.stringify(flight, null, 2),
      type,
      hasOrigin: !!flight.origin,
      hasDestination: !!flight.destination
    });

    return (
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center shadow-inner">
              <span className="text-gray-500 font-bold text-xl">?</span>
            </div>
            <div>
            <h3 className="font-bold text-gray-900 text-xl">
              {flight.ident_iata || flight.ident || 'Unknown'}
            </h3>
              <p className="text-gray-500 text-sm font-medium">
                {flight.aircraft_type || 'Unknown Aircraft'}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-3xl font-black text-gray-900">
              --:--
            </div>
            <div className="text-sm font-semibold text-red-500 bg-red-50 px-3 py-1 rounded-full">
              Data Error
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">From</div>
              <div className="font-bold text-gray-900 text-lg">
                Unknown
              </div>
              <div className="text-xs text-gray-500">
                Missing Data
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-12 h-0.5 bg-gray-300"></div>
              <svg className="w-5 h-5 text-gray-400 mx-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <div className="w-12 h-0.5 bg-gray-300"></div>
            </div>

            <div className="text-center">
              <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">To</div>
              <div className="font-bold text-gray-900 text-lg">
                Unknown
              </div>
              <div className="text-xs text-gray-500">
                Missing Data
              </div>
            </div>
          </div>

          <div className="text-right text-sm text-gray-500">
            <div className="bg-gray-100 px-3 py-1 rounded-full font-medium">Data Error</div>
          </div>
        </div>
      </div>
    );
  }
  
  const scheduledTime = isDeparture ? flight.scheduled_off : flight.scheduled_on;
  const estimatedTime = isDeparture ? flight.estimated_off : flight.estimated_on;
  const actualTime = isDeparture ? flight.actual_off : flight.actual_on;
  
  const displayTime = actualTime || estimatedTime || scheduledTime;
  // Always use Brunei timezone for BWN airport flights
  const timezone = 'Asia/Brunei';
  
  const status = flight.status || 'Scheduled';
  const statusColor = getStatusColor(status);

  // Get status badge styling
  const getStatusBadgeStyle = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('arrived') || statusLower.includes('gate arrival')) {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    if (statusLower.includes('departed') || statusLower.includes('gate departure')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    if (statusLower.includes('delayed')) {
      return 'bg-orange-100 text-orange-800 border-orange-200';
    }
    if (statusLower.includes('cancelled')) {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    if (statusLower.includes('on time') || statusLower.includes('scheduled')) {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {/* Airline Logo */}
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              {currentLogo ? (
                <img
                  src={currentLogo}
                  alt={airlineName}
                  className="w-12 h-12 object-contain"
                  onError={() => {
                    // advance to next candidate; if none, show monogram
                    if (logoIndex < logoCandidates.length - 1) {
                      setLogoIndex(logoIndex + 1);
                    } else {
                      setLogoIndex(-1);
                    }
                  }}
                />
              ) : (
                <span className="text-white font-bold text-lg">
                  {(flight.ident_iata || flight.ident)?.substring(0, 2)}
                </span>
              )}
            </div>
            {/* Status indicator dot */}
            <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
              status.toLowerCase().includes('delayed') ? 'bg-orange-500' :
              status.toLowerCase().includes('cancelled') ? 'bg-red-500' :
              status.toLowerCase().includes('arrived') || status.toLowerCase().includes('departed') ? 'bg-green-500' :
              'bg-blue-500'
            }`}></div>
          </div>

          {/* Flight Info */}
          <div>
            <h3 className="font-bold text-gray-900 text-xl group-hover:text-blue-600 transition-colors">
              {flight.ident_iata || flight.ident}
            </h3>
            <p className="text-gray-600 text-sm font-medium">
              {airlineName}
            </p>
            <p className="text-gray-500 text-xs">
              {flight.aircraft_type} • {flight.registration}
            </p>
          </div>
        </div>
        
        {/* Time and Status */}
        <div className="text-right">
          <div className="text-3xl font-black text-gray-900 mb-1">
            {formatLocalTime(displayTime, timezone)}
          </div>
          <div className={`text-sm font-semibold px-3 py-1 rounded-full border ${getStatusBadgeStyle(status)}`}>
            {status}
          </div>
          {((isDeparture && flight.departure_delay !== 0) || (!isDeparture && flight.arrival_delay !== 0)) && (
            <div className={`text-xs font-medium mt-1 ${
              (isDeparture ? flight.departure_delay : flight.arrival_delay) > 0 ? 'text-orange-600' : 'text-green-600'
            }`}>
              {isDeparture 
                ? `${(flight.departure_delay || 0) > 0 ? '+' : ''}${Math.floor((flight.departure_delay || 0) / 60)}min` 
                : `${(flight.arrival_delay || 0) > 0 ? '+' : ''}${Math.floor((flight.arrival_delay || 0) / 60)}min`
              }
            </div>
          )}
        </div>
      </div>

      {/* Route Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* From Airport */}
          <div className="text-center">
            <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">From</div>
            <div className="font-bold text-gray-900 text-lg">
              {origin.code_iata || origin.code}
            </div>
            <div className="text-xs text-gray-500">
              {origin.city}
            </div>
          </div>
          
          {/* Arrow */}
          <div className="flex items-center">
            <div className="w-12 h-0.5 bg-gradient-to-r from-gray-300 to-gray-400"></div>
            <div className="mx-2 p-2 bg-gray-100 rounded-full">
              <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="w-12 h-0.5 bg-gradient-to-r from-gray-400 to-gray-300"></div>
          </div>
          
          {/* To Airport */}
          <div className="text-center">
            <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">To</div>
            <div className="font-bold text-gray-900 text-lg">
              {destination.code_iata || destination.code}
            </div>
            <div className="text-xs text-gray-500">
              {destination.city}
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-right text-sm text-gray-500 space-y-1">
          {flight.route_distance && (
            <div className="bg-gray-50 px-3 py-1 rounded-full font-medium">
              {flight.route_distance.toLocaleString()} mi
            </div>
          )}
          {flight.gate_origin && (
            <div className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
              Gate: {flight.gate_origin}
            </div>
          )}
          {flight.progress_percent > 0 && (
            <div className="w-20 bg-gray-200 rounded-full h-1.5 mt-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${flight.progress_percent}%` }}
              ></div>
            </div>
          )}
        </div>
      </div>

      {/* Flight Progress Bar (if available) */}
      {flight.progress_percent > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>Flight Progress</span>
            <span>{flight.progress_percent}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${flight.progress_percent}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}