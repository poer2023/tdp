import NodeGeocoder from "node-geocoder";

const geocoder = NodeGeocoder({
  provider: "openstreetmap",
  formatter: null,
});

export interface LocationInfo {
  locationName?: string;
  city?: string;
  country?: string;
}

export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<LocationInfo | null> {
  try {
    const results = await geocoder.reverse({ lat: latitude, lon: longitude });

    if (!results || results.length === 0) return null;

    const location = results[0];
    if (!location) return null;

    const result: LocationInfo = {};
    if (location.formattedAddress) result.locationName = location.formattedAddress;
    const cityValue = location.city || location.county;
    if (cityValue) result.city = cityValue;
    if (location.country) result.country = location.country;

    // Return null if the result object is empty
    if (Object.keys(result).length === 0) return null;

    return result;
  } catch (error) {
    console.error("Geocoding failed:", error);
    return null;
  }
}
