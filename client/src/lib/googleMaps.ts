import { Place } from "@shared/schema";
import { Location } from "./types";

/**
 * Utility functions for Google Maps integration without using APIs
 */

/**
 * Generate a Google Maps search URL for a place
 */
export function getGoogleMapsSearchUrl(place: Place): string {
  const query = encodeURIComponent(`${place.name} ${place.address || ''}`);
  return `https://www.google.com/maps/search/${query}`;
}

/**
 * Generate a Google Maps URL with coordinates
 */
export function getGoogleMapsLocationUrl(lat: number, lng: number, label?: string): string {
  const coords = `${lat},${lng}`;
  if (label) {
    const encodedLabel = encodeURIComponent(label);
    return `https://www.google.com/maps/place/${encodedLabel}/@${coords},17z`;
  }
  return `https://www.google.com/maps/@${coords},17z`;
}

/**
 * Generate a Google Maps directions URL
 */
export function getGoogleMapsDirectionsUrl(destination: Place, origin?: Location): string {
  let url = 'https://www.google.com/maps/dir/';
  
  if (origin) {
    url += `${origin.lat},${origin.lng}/`;
  }
  
  if (destination.latitude && destination.longitude) {
    url += `${destination.latitude},${destination.longitude}`;
  } else {
    const query = encodeURIComponent(`${destination.name} ${destination.address || ''}`);
    url += query;
  }
  
  return url;
}

/**
 * Generate a Google Maps place search URL by name and location
 */
export function getGoogleMapsPlaceUrl(placeName: string, location?: Location): string {
  let query = encodeURIComponent(placeName);
  
  if (location) {
    query += `+near+${location.lat},${location.lng}`;
  }
  
  return `https://www.google.com/maps/search/${query}`;
}

/**
 * Open Google Maps in a new tab
 */
export function openGoogleMaps(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Search for a place on Google Maps
 */
export function searchPlaceOnGoogleMaps(place: Place): void {
  const url = getGoogleMapsSearchUrl(place);
  openGoogleMaps(url);
}

/**
 * Get directions to a place on Google Maps
 */
export function getDirectionsOnGoogleMaps(destination: Place, origin?: Location): void {
  const url = getGoogleMapsDirectionsUrl(destination, origin);
  openGoogleMaps(url);
}

/**
 * View a place on Google Maps with coordinates
 */
export function viewPlaceOnGoogleMaps(place: Place): void {
  if (place.latitude && place.longitude) {
    const url = getGoogleMapsLocationUrl(
      parseFloat(place.latitude),
      parseFloat(place.longitude),
      place.name
    );
    openGoogleMaps(url);
  } else {
    searchPlaceOnGoogleMaps(place);
  }
}