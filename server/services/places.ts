

import { Place } from '@shared/schema';

export class PlacesService {
  constructor() {}

  // Map frontend categories to valid OpenTripMap kinds
  private mapCategoryToOtmKinds(category: string): string {
    const categoryMappings: Record<string, string> = {
      'restaurant': 'foods',
      'cafe': 'foods',
      'bar': 'foods',
      'shopping': 'shops',
      'entertainment': 'entertainment,amusements,cultural,theatres',
      'health & fitness': 'sport',
      'services': 'commercial',
      'lodging': 'accomodations',
      'other': 'interesting_places'
    };
    
    return categoryMappings[category.toLowerCase()] || 'interesting_places';
  }

  async searchNearby(lat: number, lng: number, radius: number, type?: string): Promise<Place[]> {
    // Use OpenTripMap API for nearby places
    const apiKey = process.env.OPENTRIPMAP_API_KEY;
    if (!apiKey) {
      throw new Error('OpenTripMap API key is required. Please set OPENTRIPMAP_API_KEY environment variable (free API key available from opentripmap.org)');
    }
    
    // Debug: Check API key format (first few characters only for security)
    console.log('[OpenTripMap Debug] API key format check:', apiKey.substring(0, 8) + '...', 'length:', apiKey.length);
    const baseUrl = 'https://api.opentripmap.com/0.1/en/places/radius';
    const paramsObj: Record<string, string> = {
      radius: radius.toString(),
      lon: lng.toString(),
      lat: lat.toString(),
      apikey: apiKey
    };
    if (type && typeof type === 'string' && type.trim() !== '') {
      // Map frontend category to valid OpenTripMap kinds
      const mappedKinds = this.mapCategoryToOtmKinds(type);
      paramsObj.kinds = mappedKinds;
    }
    const params = new URLSearchParams(paramsObj);
    const requestUrl = `${baseUrl}?${params}`;
    // Log request without exposing API key for security
    const logParams = { ...paramsObj };
    delete logParams.apikey;
    const logUrl = `${baseUrl}?${new URLSearchParams(logParams)}`;
    console.log('[OpenTripMap Request]', logUrl, '(API key hidden for security)');
    const response = await fetch(requestUrl);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[OpenTripMap Error]', response.status, errorText);
      throw new Error(`OpenTripMap error: ${response.statusText}`);
    }
    const data = await response.json();
    if (!data.features) {
      console.warn('[OpenTripMap Response] No features found', data);
      return [];
    }
    return data.features.map((feature: any) => this.convertOtmPlace(feature));
  }

  async searchByText(query: string, lat?: number, lng?: number): Promise<Place[]> {
    // Use OpenStreetMap Nominatim for geocoding
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
    const response = await fetch(nominatimUrl);
    if (!response.ok) {
      throw new Error(`Nominatim error: ${response.statusText}`);
    }
    const data = await response.json();
    return data.map((result: any) => this.convertNominatimPlace(result));
  }

  private convertOtmPlace(feature: any): Place {
    return {
      id: feature.properties.xid,
      name: feature.properties.name,
      address: feature.properties.address || '',
      latitude: feature.geometry.coordinates[1].toString(),
      longitude: feature.geometry.coordinates[0].toString(),
      category: feature.properties.kinds || '',
      rating: null,
      priceLevel: null,
      photoUrl: null,
      isOpen: null,
      businessStatus: null,
      types: feature.properties.kinds ? feature.properties.kinds.split(',') : [],
      aiCategory: null,
      aiTags: null
    };
  }

  private convertNominatimPlace(result: any): Place {
    return {
      id: result.place_id,
      name: result.display_name,
      address: result.display_name,
      latitude: result.lat,
      longitude: result.lon,
      category: result.type || '',
      rating: null,
      priceLevel: null,
      photoUrl: null,
      isOpen: null,
      businessStatus: null,
      types: [result.type],
      aiCategory: null,
      aiTags: null
    };
  }
}

export const placesService = new PlacesService();
