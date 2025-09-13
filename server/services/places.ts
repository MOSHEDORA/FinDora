

import { Place } from '@shared/schema';

export class PlacesService {
  constructor() {}

  // Map frontend categories to valid OpenTripMap kinds
  private mapCategoryToOtmKinds(category: string): string {
    const categoryMappings: Record<string, string> = {
      'restaurant': 'interesting_places',
      'cafe': 'interesting_places',
      'bar': 'interesting_places',
      'shopping': 'interesting_places',
      'entertainment': 'interesting_places,cultural,theatres',
      'health & fitness': 'interesting_places',
      'services': 'interesting_places',
      'lodging': 'interesting_places',
      'other': 'interesting_places'
    };
    
    return categoryMappings[category.toLowerCase()] || 'interesting_places';
  }

  async searchNearby(lat: number, lng: number, radius: number, type?: string): Promise<Place[]> {
    // Use OpenTripMap API for nearby places
    const apiKey = process.env.OPENTRIPMAP_API_KEY || '5ae2e3f221c38a28845f05b6b8bfcc6aa8e8c6569e7d42adbb3ddbf5';
    if (!apiKey) {
      throw new Error('OpenTripMap API key is required (free, get from opentipmap.org)');
    }
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
    console.log('[OpenTripMap Request]', requestUrl);
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
