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
  const onPlaceSelectRef = useRef(onPlaceSelect);
  
  // Update ref when onPlaceSelect changes
  useEffect(() => {
    onPlaceSelectRef.current = onPlaceSelect;
  }, [onPlaceSelect]);

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

      // Create popup content safely to prevent XSS
      const popupDiv = document.createElement('div');
      popupDiv.style.minWidth = '200px';
      
      const nameHeader = document.createElement('h3');
      nameHeader.style.cssText = 'margin: 0 0 8px 0; font-weight: 600;';
      nameHeader.textContent = place.name;
      
      const categoryP = document.createElement('p');
      categoryP.style.cssText = 'margin: 0 0 4px 0; color: #666; font-size: 14px;';
      categoryP.textContent = place.aiCategory || place.category || 'Data Not Available';
      
      const ratingP = document.createElement('p');
      ratingP.style.cssText = place.rating ? 'margin: 0 0 4px 0; font-size: 14px;' : 'margin: 0 0 4px 0; font-size: 14px; color: #999;';
      ratingP.textContent = place.rating ? `⭐ ${place.rating}` : 'Rating: Data Not Available';
      
      const addressP = document.createElement('p');
      addressP.style.cssText = place.address ? 'margin: 0; color: #666; font-size: 12px;' : 'margin: 0; color: #999; font-size: 12px;';
      addressP.textContent = place.address || 'Address: Data Not Available';
      
      popupDiv.appendChild(nameHeader);
      popupDiv.appendChild(categoryP);
      popupDiv.appendChild(ratingP);
      popupDiv.appendChild(addressP);

      const marker = L.marker([lat, lng], { icon: placeIcon })
        .addTo(map)
        .bindPopup(popupDiv)
        .bindTooltip(place.name, {
          permanent: false,
          direction: 'top',
          offset: [0, -10],
          className: 'place-tooltip'
        });

      // Show tooltip on hover
      marker.on('mouseover', () => {
        marker.openTooltip();
      });

      marker.on('mouseout', () => {
        marker.closeTooltip();
      });

      marker.on('click', () => {
        onPlaceSelectRef.current?.(place);
      });

      markersRef.current.push(marker);
    });
  }, [places, center]);

  return (
    <div className={className}>
      <div ref={mapRef} className="w-full h-full rounded-lg" data-testid="map-container" />
    </div>
  );
}
