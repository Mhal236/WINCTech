/**
 * Distance Calculation Service
 * Uses postcodes.io API (free, no auth required) to calculate distance between UK postcodes
 */

interface PostcodeData {
  postcode: string;
  latitude: number;
  longitude: number;
  region: string;
  admin_district: string;
}

interface PostcodeResponse {
  status: number;
  result: PostcodeData | null;
}

// Default travel cost rate (£ per mile) - HMRC approved mileage rate
const DEFAULT_COST_PER_MILE = 0.45;

/**
 * Validate UK postcode format
 */
export function isValidPostcode(postcode: string): boolean {
  // UK postcode regex pattern
  const postcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i;
  return postcodeRegex.test(postcode.trim());
}

/**
 * Format postcode to standard format (removes extra spaces, uppercases)
 */
export function formatPostcode(postcode: string): string {
  return postcode.trim().toUpperCase().replace(/\s+/g, ' ');
}

/**
 * Get latitude and longitude for a UK postcode
 */
async function getPostcodeData(postcode: string): Promise<PostcodeData | null> {
  try {
    const formattedPostcode = formatPostcode(postcode);
    const response = await fetch(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(formattedPostcode)}`
    );

    if (!response.ok) {
      console.error(`Postcode lookup failed for ${postcode}: ${response.status}`);
      return null;
    }

    const data: PostcodeResponse = await response.json();
    
    if (data.status === 200 && data.result) {
      return data.result;
    }

    return null;
  } catch (error) {
    console.error('Error fetching postcode data:', error);
    return null;
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in miles
 */
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate distance between two UK postcodes
 * Returns distance in miles or null if calculation fails
 */
export async function calculateDistance(
  postcodeFrom: string,
  postcodeTo: string
): Promise<{
  distance: number | null;
  error?: string;
  fromPostcode?: PostcodeData;
  toPostcode?: PostcodeData;
}> {
  try {
    // Validate postcodes
    if (!isValidPostcode(postcodeFrom)) {
      return {
        distance: null,
        error: `Invalid postcode format: ${postcodeFrom}`,
      };
    }

    if (!isValidPostcode(postcodeTo)) {
      return {
        distance: null,
        error: `Invalid postcode format: ${postcodeTo}`,
      };
    }

    // Fetch data for both postcodes
    const [fromData, toData] = await Promise.all([
      getPostcodeData(postcodeFrom),
      getPostcodeData(postcodeTo),
    ]);

    if (!fromData) {
      return {
        distance: null,
        error: `Could not find postcode: ${postcodeFrom}`,
      };
    }

    if (!toData) {
      return {
        distance: null,
        error: `Could not find postcode: ${postcodeTo}`,
      };
    }

    // Calculate distance using Haversine formula
    const distance = calculateHaversineDistance(
      fromData.latitude,
      fromData.longitude,
      toData.latitude,
      toData.longitude
    );

    return {
      distance,
      fromPostcode: fromData,
      toPostcode: toData,
    };
  } catch (error) {
    console.error('Error calculating distance:', error);
    return {
      distance: null,
      error: error instanceof Error ? error.message : 'Unknown error calculating distance',
    };
  }
}

/**
 * Calculate travel cost based on distance
 */
export function calculateTravelCost(
  distanceInMiles: number,
  costPerMile: number = DEFAULT_COST_PER_MILE
): number {
  return Math.round(distanceInMiles * costPerMile * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate distance and travel cost in one call
 */
export async function calculateDistanceAndCost(
  postcodeFrom: string,
  postcodeTo: string,
  costPerMile: number = DEFAULT_COST_PER_MILE
): Promise<{
  distance: number | null;
  travelCost: number | null;
  error?: string;
}> {
  const result = await calculateDistance(postcodeFrom, postcodeTo);

  if (result.distance === null) {
    return {
      distance: null,
      travelCost: null,
      error: result.error,
    };
  }

  const travelCost = calculateTravelCost(result.distance, costPerMile);

  return {
    distance: result.distance,
    travelCost,
  };
}

export { DEFAULT_COST_PER_MILE };

