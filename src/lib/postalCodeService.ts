// lib/postalCodeService.ts

export interface PostalCodeResult {
  code: string;
  city: string;
  lat: number;
  lng: number;
  province?: string;
  municipality?: string;
}

// In-memory cache for postal code lookups (survives during session)
const postalCodeCache = new Map<string, PostalCodeResult>();

// Fallback postal codes (your existing ones + more Groningen)
const fallbackPostalCodes: PostalCodeResult[] = [
  // Groningen area (expanded)
  { code: "9711", city: "Groningen", lat: 53.2194, lng: 6.5665 },
  { code: "9712", city: "Groningen", lat: 53.2178, lng: 6.5612 },
  { code: "9713", city: "Groningen", lat: 53.2159, lng: 6.5587 },
  { code: "9714", city: "Groningen", lat: 53.2217, lng: 6.5519 },
  { code: "9715", city: "Groningen", lat: 53.2282, lng: 6.5539 },
  { code: "9716", city: "Groningen", lat: 53.2311, lng: 6.5582 },
  { code: "9717", city: "Groningen", lat: 53.2274, lng: 6.5707 },
  { code: "9718", city: "Groningen", lat: 53.2245, lng: 6.5819 },
  { code: "9721", city: "Groningen", lat: 53.2158, lng: 6.5887 },
  { code: "9722", city: "Groningen", lat: 53.2116, lng: 6.5905 },
  { code: "9723", city: "Groningen", lat: 53.2071, lng: 6.5943 },
  { code: "9724", city: "Groningen", lat: 53.2032, lng: 6.5881 },
  { code: "9725", city: "Groningen", lat: 53.1999, lng: 6.5779 },
  { code: "9726", city: "Groningen", lat: 53.1955, lng: 6.5668 },
  { code: "9727", city: "Groningen", lat: 53.1980, lng: 6.5572 },
  { code: "9728", city: "Groningen", lat: 53.2013, lng: 6.5494 },
  { code: "9731", city: "Groningen", lat: 53.2343, lng: 6.5933 },
  { code: "9732", city: "Groningen", lat: 53.2378, lng: 6.6043 },
  { code: "9733", city: "Groningen", lat: 53.2401, lng: 6.6233 },
  { code: "9734", city: "Groningen", lat: 53.2422, lng: 6.6389 },
  { code: "9735", city: "Groningen", lat: 53.2359, lng: 6.6481 },
  
  // Amsterdam
  { code: "1011", city: "Amsterdam", lat: 52.3747, lng: 4.8986 },
  { code: "1012", city: "Amsterdam", lat: 52.3702, lng: 4.8952 },
  { code: "1013", city: "Amsterdam", lat: 52.3890, lng: 4.9007 },
  { code: "1015", city: "Amsterdam", lat: 52.3680, lng: 4.8820 },
  { code: "1016", city: "Amsterdam", lat: 52.3584, lng: 4.8811 },
  
  // Arnhem
  { code: "6811", city: "Arnhem", lat: 51.9851, lng: 5.8987 },
  { code: "6812", city: "Arnhem", lat: 51.9800, lng: 5.9100 },
  
  // Rotterdam
  { code: "3011", city: "Rotterdam", lat: 51.9225, lng: 4.4792 },
  { code: "3012", city: "Rotterdam", lat: 51.9191, lng: 4.4758 },
  
  // Utrecht
  { code: "3511", city: "Utrecht", lat: 52.0931, lng: 5.1214 },
  { code: "3512", city: "Utrecht", lat: 52.0907, lng: 5.1214 },
];

/**
 * Search postal codes using PDOK Locatieserver API
 * This is a FREE Dutch government API that covers ALL Dutch postal codes
 */
export async function searchPostalCode(query: string): Promise<PostalCodeResult[]> {
  if (!query || query.trim().length < 3) {
    return fallbackPostalCodes;
  }

  const searchTerm = query.trim().toLowerCase();

  // Check cache for this exact search query (not individual postal codes)
  const cacheKey = `search_${searchTerm}`;
  const cachedResults = postalCodeCache.get(cacheKey);
  if (cachedResults && Array.isArray(cachedResults)) {
    console.log('💾 Using cached results for:', searchTerm);
    return cachedResults as unknown as PostalCodeResult[];
  }

  try {
    // Extract the numeric part to find nearby postal codes
    const numericPart = query.match(/^\d+/)?.[0] || '';
    
    // PDOK Locatieserver API - Free, no API key needed!
    // Docs: https://github.com/PDOK/locatieserver/wiki/API-Locatieserver
    // Use wildcard search to get postal codes starting with the same numbers
    const searchQuery = numericPart ? `${numericPart}*` : query;
    const url = `https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?q=${encodeURIComponent(searchQuery)}&fq=type:postcode&rows=50`;
    
    console.log('🌐 Calling PDOK API:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('⚠️  PDOK API error, falling back to local data');
      return searchFallbackPostalCodes(searchTerm);
    }

    const data = await response.json();
    console.log('📦 PDOK Response:', data);
    
    if (!data.response?.docs || data.response.docs.length === 0) {
      console.log('📭 No results from PDOK, using fallback');
      return searchFallbackPostalCodes(searchTerm);
    }

    // Transform PDOK results to our format
    const results: PostalCodeResult[] = data.response.docs.map((doc: any) => {
      // Extract postal code from the postcode field (format: "1234AB")
      const postalCode = doc.postcode || '';
      
      // PDOK returns coordinates in WKT POINT format: "POINT(lng lat)"
      let lat = 0;
      let lng = 0;
      
      if (doc.centroide_ll) {
        // Parse WKT POINT format: "POINT(6.61548052 53.23957035)"
        const match = doc.centroide_ll.match(/POINT\(([\d.]+)\s+([\d.]+)\)/);
        if (match) {
          lng = parseFloat(match[1]); // First number is longitude
          lat = parseFloat(match[2]); // Second number is latitude
        }
      }

      return {
        code: postalCode,
        city: doc.woonplaatsnaam || doc.gemeentenaam || '',
        lat,
        lng,
        province: doc.provincienaam,
        municipality: doc.gemeentenaam,
      };
    });

    // Sort results to prioritize exact matches and nearby postal codes
    const sortedResults = results.sort((a, b) => {
      const aCode = a.code.toLowerCase();
      const bCode = b.code.toLowerCase();
      const search = searchTerm.toLowerCase();
      
      // Exact match first
      if (aCode === search) return -1;
      if (bCode === search) return 1;
      
      // Then starts with search term
      if (aCode.startsWith(search) && !bCode.startsWith(search)) return -1;
      if (bCode.startsWith(search) && !aCode.startsWith(search)) return 1;
      
      // For codes that both start with search term, sort by the rest alphabetically
      // This groups 9733CA, 9733CB, 9733CC together
      if (aCode.startsWith(search) && bCode.startsWith(search)) {
        return aCode.localeCompare(bCode);
      }
      
      // Then alphabetically for everything else
      return aCode.localeCompare(bCode);
    });

    console.log('📋 First 10 sorted results:', sortedResults.slice(0, 10).map(r => r.code));

    // Cache the entire sorted result set for this search query
    postalCodeCache.set(cacheKey, sortedResults as any);

    console.log('🎯 Returning', sortedResults.length, 'results');
    return sortedResults;

  } catch (error) {
    console.error('Error fetching from PDOK:', error);
    return searchFallbackPostalCodes(searchTerm);
  }
}

/**
 * Get exact postal code with coordinates
 */
export async function getPostalCode(postalCode: string): Promise<PostalCodeResult | null> {
  const cleanCode = postalCode.replace(/\s/g, '').toLowerCase();
  
  // Check cache first
  if (postalCodeCache.has(cleanCode)) {
    return postalCodeCache.get(cleanCode) || null;
  }

  // Try PDOK API
  const results = await searchPostalCode(postalCode);
  return results.length > 0 ? results[0] : null;
}

/**
 * Search in fallback postal codes (when API is unavailable)
 */
function searchFallbackPostalCodes(searchTerm: string): PostalCodeResult[] {
  return fallbackPostalCodes.filter(pc => 
    pc.code.toLowerCase().includes(searchTerm) || 
    pc.city.toLowerCase().includes(searchTerm)
  );
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}