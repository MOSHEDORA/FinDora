export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface PlaceFilters {
  category?: string;
  rating?: number;
  priceLevel?: number[];
  radius?: number;
  sortBy?: 'distance' | 'rating' | 'popularity' | 'reviews';
}

export interface SearchParams {
  query?: string;
  location: Location;
  radius: number;
  filters?: PlaceFilters;
}
