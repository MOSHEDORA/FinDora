import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Place } from "@shared/schema";
import { Location } from "@/lib/types";

// Fix for default markers in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapProps {
  center: Location;
  places: Place[];
  onPlaceSelect?: (place: Place) => void;
  className?: string;
}

export function Map({ center, places, onPlaceSelect, className = "h-full" }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([center.lat, center.lng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map center when location changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([center.lat, center.lng], 13);
    }
  }, [center]);

  // Update markers when places change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach(marker => map.removeLayer(marker));
    markersRef.current = [];

    // Add center marker
    const centerIcon = L.divIcon({
      className: 'center-marker',
      html: '<div style="background-color: #EA4335; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    const centerMarker = L.marker([center.lat, center.lng], { icon: centerIcon })
      .addTo(map)
      .bindPopup('Your Location');
    
    markersRef.current.push(centerMarker);

    // Add place markers
    places.forEach((place) => {
      if (!place.latitude || !place.longitude) return;

      const lat = parseFloat(place.latitude);
      const lng = parseFloat(place.longitude);

      // Color code markers by category
      const getMarkerColor = (category: string | null) => {
        switch (category) {
          case 'Restaurant':
          case 'Cafe':
          case 'Bar':
            return '#EA4335'; // accent red
          case 'Entertainment':
          case 'park':
            return '#4285F4'; // primary blue
          case 'Shopping':
          case 'store':
            return '#34A853'; // secondary green
          default:
            return '#9CA3AF'; // gray
        }
      };

      const color = getMarkerColor(place.aiCategory || place.category);
      const placeIcon = L.divIcon({
        className: 'place-marker',
        html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      const marker = L.marker([lat, lng], { icon: placeIcon })
        .addTo(map)
        .bindPopup(`
          <div style="min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-weight: 600;">${place.name}</h3>
            <p style="margin: 0 0 4px 0; color: #666; font-size: 14px;">${place.aiCategory || place.category}</p>
            ${place.rating ? `<p style="margin: 0 0 4px 0; font-size: 14px;">⭐ ${place.rating}</p>` : ''}
            ${place.address ? `<p style="margin: 0; color: #666; font-size: 12px;">${place.address}</p>` : ''}
          </div>
        `);

      marker.on('click', () => {
        onPlaceSelect?.(place);
      });

      markersRef.current.push(marker);
    });
  }, [places, center, onPlaceSelect]);

  return (
    <div className={className}>
      <div ref={mapRef} className="w-full h-full rounded-lg" data-testid="map-container" />
    </div>
  );
}
