const FLIGHTAWARE_API_KEY = 'Mgglvnr4cBWzGo88ar2WVpuJCGiqZ3GO';
const FLIGHTAWARE_BASE_URL = 'https://aeroapi.flightaware.com/aeroapi';

export interface Flight {
  ident: string;
  ident_iata: string;
  ident_icao: string;
  fa_flight_id: string;
  operator: string;
  operator_icao: string;
  operator_iata: string;
  flight_number: string;
  registration: string;
  origin: {
    code: string;
    code_iata: string;
    code_icao: string;
    code_lid: string;
    timezone: string;
    name: string;
    city: string;
    airport_info_url: string;
  };
  destination: {
    code: string;
    code_iata: string;
    code_icao: string;
    code_lid: string;
    timezone: string;
    name: string;
    city: string;
    airport_info_url: string;
  };
  scheduled_out: string;
  estimated_out: string;
  actual_out: string | null;
  scheduled_off: string;
  estimated_off: string;
  actual_off: string | null;
  scheduled_on: string;
  estimated_on: string;
  actual_on: string | null;
  scheduled_in: string;
  estimated_in: string;
  actual_in: string | null;
  status: string;
  aircraft_type: string;
  route_distance: number;
  progress_percent: number;
  departure_delay: number;
  arrival_delay: number;
  gate_origin: string | null;
  gate_destination: string | null;
  terminal_origin: string | null;
  terminal_destination: string | null;
  baggage_claim: string | null;
}

export interface FlightResponse {
  flights?: Flight[];
  departures?: Flight[];
  arrivals?: Flight[];
  links: {
    next: string;
    prev: string;
  } | null;
  num_pages: number;
}

function getBruneiUtcRange(date: string): { startUtc: string; endUtc: string } {
  // Interpret the provided YYYY-MM-DD as Asia/Brunei local midnight to 23:59:59,
  // then convert to UTC ISO strings for the API
  const start = new Date(`${date}T00:00:00+08:00`).toISOString();
  const end = new Date(`${date}T23:59:59+08:00`).toISOString();
  return { startUtc: start, endUtc: end };
}

async function fetchWithAirportFallback(
  urlBuilder: (airportCode: string) => string,
  headers: Record<string, string>,
): Promise<Response> {
  // Try with provided airport first (likely IATA=BWN). If empty result later, caller may try ICAO.
  return fetch(urlBuilder('BWN'), { headers, signal: AbortSignal.timeout(15000) });
}

export async function getDepartures(airport: string, date: string): Promise<Flight[]> {
  try {
    const { startUtc: startDate, endUtc: endDate } = getBruneiUtcRange(date);
    
    console.log('Fetching departures for', airport, 'from', startDate, 'to', endDate);
    console.log('API URL:', `${FLIGHTAWARE_BASE_URL}/airports/${airport}/flights/departures?start=${startDate}&end=${endDate}&max_pages=5`);
    
    // Try the API call
    const response = await fetch(
      `${FLIGHTAWARE_BASE_URL}/airports/${airport}/flights/departures?start=${startDate}&end=${endDate}&max_pages=5`,
      {
        headers: {
          'x-apikey': FLIGHTAWARE_API_KEY,
        },
        // Add timeout
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('FlightAware API error:', response.status, errorText);
      throw new Error(`FlightAware API error: ${response.status} - ${errorText}`);
    }

    const data: FlightResponse = await response.json();
    console.log('Departures API response for', airport, 'on', date, ':', JSON.stringify(data, null, 2));
    
    // Check for flights in different possible response structures
    const flights = data.departures || data.flights || [];
    
    if (flights.length === 0) {
      console.log('No departures found for', airport, 'on', date);
      console.log('This could be because:');
      console.log('1. No flights scheduled for this date');
      console.log('2. API doesn\'t have data for future dates');
      console.log('3. Airport code might be incorrect');
      
      // Fallback: if IATA code was used, try ICAO for BWN (WBSB)
      if (airport.toUpperCase() === 'BWN') {
        try {
          console.log('Trying ICAO fallback WBSB for departures...');
          const icaoRes = await fetch(
            `${FLIGHTAWARE_BASE_URL}/airports/WBSB/flights/departures?start=${startDate}&end=${endDate}&max_pages=5`,
            {
              headers: { 'x-apikey': FLIGHTAWARE_API_KEY },
              signal: AbortSignal.timeout(12000),
            }
          );
          if (icaoRes.ok) {
            const icaoData: FlightResponse = await icaoRes.json();
            const icaoFlights = icaoData.departures || icaoData.flights || [];
            if (icaoFlights.length > 0) {
              console.log('Found', icaoFlights.length, 'departures via ICAO WBSB');
              return icaoFlights;
            }
          }
        } catch (e) {
          console.warn('ICAO fallback WBSB failed for departures:', e);
        }
      }

      // Try alternative API endpoint for future dates
      console.log('Trying alternative API endpoint...');
      try {
        const altResponse = await fetch(
          `${FLIGHTAWARE_BASE_URL}/airports/${airport}/flights?start=${startDate}&end=${endDate}&max_pages=5`,
          {
            headers: {
              'x-apikey': FLIGHTAWARE_API_KEY,
            },
            signal: AbortSignal.timeout(10000),
          }
        );
        
        if (altResponse.ok) {
          const altData = await altResponse.json();
          console.log('Alternative API response:', altData);
          const altFlights = altData.departures || altData.flights || [];
          if (altFlights.length > 0) {
            console.log('Found', altFlights.length, 'flights using alternative endpoint');
            return altFlights.filter((flight: any) => {
              const hasOrigin = flight.origin;
              const hasDestination = flight.destination;
              // Be less restrictive - keep flights even if they have missing data
      return true; // Keep all flights for now to see what we get
            });
          }
        }
      } catch (altError) {
        console.log('Alternative API also failed:', altError);
      }
      
      return [];
    }
    
    console.log('Found', flights.length, 'departures');
    
    // Debug: Check the structure of the first flight
    if (flights.length > 0) {
      console.log('First departure flight structure:', JSON.stringify(flights[0], null, 2));
    }
    
    // Filter out flights with missing origin/destination data
    const validFlights = flights.filter((flight: Flight) => {
      const hasOrigin = flight.origin;
      const hasDestination = flight.destination;
      
      if (!hasOrigin || !hasDestination) {
        console.warn('Filtering out flight with missing data:', {
          ident: flight.ident,
          hasOrigin,
          hasDestination,
          origin: flight.origin,
          destination: flight.destination
        });
      }
      
      // Be less restrictive - keep flights even if they have missing data
      return true; // Keep all flights for now to see what we get
    });
    
    console.log(`Filtered ${flights.length} flights down to ${validFlights.length} valid flights`);
    
    return validFlights;
  } catch (error) {
    console.error('Error fetching departures:', error);
    return [];
  }
}

export async function getArrivals(airport: string, date: string): Promise<Flight[]> {
  try {
    const { startUtc: startDate, endUtc: endDate } = getBruneiUtcRange(date);
    
    console.log('Fetching arrivals for', airport, 'from', startDate, 'to', endDate);
    console.log('API URL:', `${FLIGHTAWARE_BASE_URL}/airports/${airport}/flights/arrivals?start=${startDate}&end=${endDate}&max_pages=5`);
    
    const response = await fetch(
      `${FLIGHTAWARE_BASE_URL}/airports/${airport}/flights/arrivals?start=${startDate}&end=${endDate}&max_pages=5`,
      {
        headers: {
          'x-apikey': FLIGHTAWARE_API_KEY,
        },
        // Add timeout
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('FlightAware API error:', response.status, errorText);
      throw new Error(`FlightAware API error: ${response.status} - ${errorText}`);
    }

    const data: FlightResponse = await response.json();
    console.log('Arrivals API response for', airport, 'on', date, ':', JSON.stringify(data, null, 2));
    
    // Check for flights in different possible response structures
    const flights = data.arrivals || data.flights || [];
    
    if (flights.length === 0) {
      console.log('No arrivals found for', airport, 'on', date);
      console.log('This could be because:');
      console.log('1. No flights scheduled for this date');
      console.log('2. API doesn\'t have data for future dates');
      console.log('3. Airport code might be incorrect');
      
      // Fallback: if IATA code was used, try ICAO for BWN (WBSB)
      if (airport.toUpperCase() === 'BWN') {
        try {
          console.log('Trying ICAO fallback WBSB for arrivals...');
          const icaoRes = await fetch(
            `${FLIGHTAWARE_BASE_URL}/airports/WBSB/flights/arrivals?start=${startDate}&end=${endDate}&max_pages=5`,
            {
              headers: { 'x-apikey': FLIGHTAWARE_API_KEY },
              signal: AbortSignal.timeout(12000),
            }
          );
          if (icaoRes.ok) {
            const icaoData: FlightResponse = await icaoRes.json();
            const icaoFlights = icaoData.arrivals || icaoData.flights || [];
            if (icaoFlights.length > 0) {
              console.log('Found', icaoFlights.length, 'arrivals via ICAO WBSB');
              return icaoFlights;
            }
          }
        } catch (e) {
          console.warn('ICAO fallback WBSB failed for arrivals:', e);
        }
      }

      // Try alternative API endpoint for future dates
      console.log('Trying alternative API endpoint...');
      try {
        const altResponse = await fetch(
          `${FLIGHTAWARE_BASE_URL}/airports/${airport}/flights?start=${startDate}&end=${endDate}&max_pages=5`,
          {
            headers: {
              'x-apikey': FLIGHTAWARE_API_KEY,
            },
            signal: AbortSignal.timeout(10000),
          }
        );
        
        if (altResponse.ok) {
          const altData = await altResponse.json();
          console.log('Alternative API response:', altData);
          const altFlights = altData.arrivals || altData.flights || [];
          if (altFlights.length > 0) {
            console.log('Found', altFlights.length, 'flights using alternative endpoint');
            return altFlights.filter((flight: any) => {
              const hasOrigin = flight.origin;
              const hasDestination = flight.destination;
              // Be less restrictive - keep flights even if they have missing data
      return true; // Keep all flights for now to see what we get
            });
          }
        }
      } catch (altError) {
        console.log('Alternative API also failed:', altError);
      }
      
      return [];
    }
    
    console.log('Found', flights.length, 'arrivals');
    
    // Debug: Check the structure of the first flight
    if (flights.length > 0) {
      console.log('First arrival flight structure:', JSON.stringify(flights[0], null, 2));
    }
    
    // Filter out flights with missing origin/destination data
    const validFlights = flights.filter((flight: Flight) => {
      const hasOrigin = flight.origin;
      const hasDestination = flight.destination;
      
      if (!hasOrigin || !hasDestination) {
        console.warn('Filtering out flight with missing data:', {
          ident: flight.ident,
          hasOrigin,
          hasDestination,
          origin: flight.origin,
          destination: flight.destination
        });
      }
      
      // Be less restrictive - keep flights even if they have missing data
      return true; // Keep all flights for now to see what we get
    });
    
    console.log(`Filtered ${flights.length} flights down to ${validFlights.length} valid flights`);
    
    return validFlights;
  } catch (error) {
    console.error('Error fetching arrivals:', error);
    return [];
  }
}

export function formatLocalTime(dateString: string, timezone: string = 'Asia/Brunei'): string {
  if (!dateString) return '--:--';
  
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function getStatusColor(status: string): string {
  const statusLower = status.toLowerCase();
  
  if (statusLower.includes('arrived') || statusLower.includes('gate arrival')) {
    return 'text-green-600';
  }
  if (statusLower.includes('departed') || statusLower.includes('gate departure')) {
    return 'text-blue-600';
  }
  if (statusLower.includes('delayed')) {
    return 'text-orange-600';
  }
  if (statusLower.includes('cancelled')) {
    return 'text-red-600';
  }
  if (statusLower.includes('on time') || statusLower.includes('scheduled')) {
    return 'text-green-600';
  }
  
  return 'text-gray-600';
}
