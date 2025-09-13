import { config } from '../config';
import { Place } from '@shared/schema';

interface GooglePlace {
  place_id: string;
  name: string;
  vicinity?: string;
  formatted_address?: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  price_level?: number;
  photos?: Array<{
    photo_reference: string;
  }>;
  opening_hours?: {
    open_now: boolean;
  };
  business_status?: string;
  types: string[];
}

export class PlacesService {
  private apiKey: string;

  constructor() {
    this.apiKey = config.googlePlacesApiKey;
    if (!this.apiKey) {
      throw new Error('Google Places API key is required');
    }
  }

  async searchNearby(lat: number, lng: number, radius: number, type?: string): Promise<Place[]> {
    const baseUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
    const params = new URLSearchParams({
      location: `${lat},${lng}`,
      radius: radius.toString(),
      key: this.apiKey
    });

    if (type) {
      params.append('type', type);
    }

    const response = await fetch(`${baseUrl}?${params}`);
    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${data.status}`);
    }

    return data.results.map((place: GooglePlace) => this.convertGooglePlace(place));
  }

  async searchByText(query: string, lat?: number, lng?: number): Promise<Place[]> {
    const baseUrl = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
    const params = new URLSearchParams({
      query,
      key: this.apiKey
    });

    if (lat && lng) {
      params.append('location', `${lat},${lng}`);
      params.append('radius', '10000'); // 10km default radius for text search
    }

    const response = await fetch(`${baseUrl}?${params}`);
    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${data.status}`);
    }

    return data.results.map((place: GooglePlace) => this.convertGooglePlace(place));
  }

  private convertGooglePlace(googlePlace: GooglePlace): Place {
    const photoUrl = googlePlace.photos?.[0]?.photo_reference 
      ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${googlePlace.photos[0].photo_reference}&key=${this.apiKey}`
      : null;

    return {
      id: googlePlace.place_id,
      name: googlePlace.name,
      address: googlePlace.vicinity || googlePlace.formatted_address || '',
      latitude: googlePlace.geometry.location.lat.toString(),
      longitude: googlePlace.geometry.location.lng.toString(),
      category: this.categorizePlace(googlePlace.types),
      rating: googlePlace.rating?.toString() || null,
      priceLevel: googlePlace.price_level || null,
      photoUrl,
      isOpen: googlePlace.opening_hours?.open_now || null,
      businessStatus: googlePlace.business_status || null,
      types: googlePlace.types,
      aiCategory: null,
      aiTags: null
    };
  }

  private categorizePlace(types: string[]): string {
    const categoryMap: Record<string, string> = {
      restaurant: 'Restaurant',
      food: 'Restaurant',
      meal_takeaway: 'Restaurant',
      cafe: 'Cafe',
      bar: 'Bar',
      shopping_mall: 'Shopping',
      store: 'Shopping',
      gas_station: 'Services',
      hospital: 'Health',
      gym: 'Health & Fitness',
      park: 'Entertainment',
      tourist_attraction: 'Entertainment',
      lodging: 'Lodging',
      bank: 'Services',
      atm: 'Services'
    };

    for (const type of types) {
      if (categoryMap[type]) {
        return categoryMap[type];
      }
    }

    return 'Other';
  }
}

export const placesService = new PlacesService();
