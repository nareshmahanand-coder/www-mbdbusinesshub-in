export type IndiaLocationSuggestion = {
  name: string;
  label: string;
  type: string;
  placeId?: string;
};

const GOOGLE_MAPS_API_KEY = "AIzaSyCNDBrTMWdMPqisYDhNJo2gR5K2dv7njNA";
const GOOGLE_MAPS_SCRIPT_ID = "google-maps-places-js";

declare global {
  interface Window {
    google?: any;
  }
}

let googleMapsPromise: Promise<any> | null = null;

export const loadGoogleMaps = () => {
  if (window.google?.maps?.places) return Promise.resolve(window.google);
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(window.google));
      existing.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&region=IN&language=en&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error("Google Maps could not be loaded"));
    document.head.appendChild(script);
  });

  return googleMapsPromise;
};

const inferLocationType = (prediction: any) => {
  const types: string[] = prediction.types || [];
  if (types.includes("sublocality") || types.includes("neighborhood")) return "Area";
  if (types.includes("locality")) return "City";
  if (types.includes("administrative_area_level_1")) return "State";
  if (types.includes("postal_code")) return "PIN";
  return "Location";
};

export const searchIndiaLocations = async (query: string): Promise<IndiaLocationSuggestion[]> => {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const google = await loadGoogleMaps();
  const service = new google.maps.places.AutocompleteService();

  return new Promise(resolve => {
    service.getPlacePredictions(
      {
        input: trimmed,
        componentRestrictions: { country: "in" },
        types: ["geocode"],
      },
      (predictions: any[] | null, status: string) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !predictions) {
          resolve([]);
          return;
        }
        resolve(
          predictions.slice(0, 12).map(prediction => ({
            name: prediction.description,
            label: prediction.description,
            type: inferLocationType(prediction),
            placeId: prediction.place_id,
          })),
        );
      },
    );
  });
};

export const reverseGeocodeIndiaLocation = async (latitude: number, longitude: number): Promise<string> => {
  const google = await loadGoogleMaps();
  const geocoder = new google.maps.Geocoder();

  return new Promise((resolve, reject) => {
    geocoder.geocode({ location: { lat: latitude, lng: longitude }, region: "IN" }, (results: any[] | null, status: string) => {
      if (status !== "OK" || !results?.length) {
        reject(new Error("Location name not found"));
        return;
      }

      const components = results[0].address_components || [];
      const byType = (type: string) => components.find((part: any) => part.types?.includes(type))?.long_name;
      const area = byType("sublocality_level_1") || byType("sublocality") || byType("neighborhood") || byType("route");
      const city = byType("locality") || byType("administrative_area_level_3") || byType("administrative_area_level_2");
      const state = byType("administrative_area_level_1");
      const pincode = byType("postal_code");
      const exact = [area, city && city !== area ? city : null, state, pincode].filter(Boolean).join(", ");
      resolve(exact || results[0].formatted_address);
    });
  });
};