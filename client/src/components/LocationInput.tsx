import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Crosshair } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Location } from "@/lib/types";

interface LocationInputProps {
  location: Location | null;
  radius: number;
  onLocationChange: (location: Location) => void;
  onRadiusChange: (radius: number) => void;
}

export function LocationInput({ location, radius, onLocationChange, onRadiusChange }: LocationInputProps) {
  const [locationInput, setLocationInput] = useState(location?.address || "");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const { toast } = useToast();

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive",
      });
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocode to get address
          const response = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${import.meta.env.VITE_OPENCAGE_API_KEY || 'demo'}`
          );
          
          let address = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          
          if (response.ok) {
            const data = await response.json();
            if (data.results && data.results[0]) {
              address = data.results[0].formatted;
            }
          }
          
          const newLocation: Location = {
            lat: latitude,
            lng: longitude,
            address,
          };
          
          setLocationInput(address);
          onLocationChange(newLocation);
          
          toast({
            title: "Location found!",
            description: "Using your current location.",
          });
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to get location details.",
            variant: "destructive",
          });
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        setIsGettingLocation(false);
        let message = "Failed to get location.";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Location permission denied.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information unavailable.";
            break;
          case error.TIMEOUT:
            message = "Location request timed out.";
            break;
        }
        
        toast({
          title: "Location error",
          description: message,
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  };

  const handleLocationSubmit = async () => {
    if (!locationInput.trim()) return;

    try {
      // Geocode the address
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(locationInput)}&key=${import.meta.env.VITE_OPENCAGE_API_KEY || 'demo'}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results[0]) {
          const result = data.results[0];
          const newLocation: Location = {
            lat: result.geometry.lat,
            lng: result.geometry.lng,
            address: result.formatted,
          };
          
          onLocationChange(newLocation);
          setLocationInput(result.formatted);
          
          toast({
            title: "Location set!",
            description: "Location has been updated.",
          });
          return;
        }
      }
      
      // Fallback: try to parse coordinates
      const coordMatch = locationInput.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
      if (coordMatch) {
        const lat = parseFloat(coordMatch[1]);
        const lng = parseFloat(coordMatch[2]);
        
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          const newLocation: Location = {
            lat,
            lng,
            address: locationInput,
          };
          
          onLocationChange(newLocation);
          toast({
            title: "Location set!",
            description: "Using coordinates provided.",
          });
          return;
        }
      }
      
      toast({
        title: "Location not found",
        description: "Please check your location input.",
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to geocode location.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4 p-4 border-b border-border">
      <h3 className="font-semibold">Location & Radius</h3>
      
      <div className="space-y-3">
        <div className="relative">
          <Input
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            placeholder="Enter location or use current"
            className="pl-10"
            onKeyDown={(e) => e.key === 'Enter' && handleLocationSubmit()}
            data-testid="input-location"
          />
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-accent" />
        </div>
        
        <Button
          onClick={getCurrentLocation}
          disabled={isGettingLocation}
          className="w-full bg-secondary hover:bg-secondary/90"
          data-testid="button-current-location"
        >
          <Crosshair className="mr-2 h-4 w-4" />
          {isGettingLocation ? "Getting location..." : "Use Current Location"}
        </Button>
        
        {locationInput !== (location?.address || "") && (
          <Button
            onClick={handleLocationSubmit}
            variant="outline"
            className="w-full"
            data-testid="button-set-location"
          >
            Set Location
          </Button>
        )}
        
        <div>
          <Label className="block text-sm font-medium mb-2">Search Radius</Label>
          <Select value={radius.toString()} onValueChange={(value) => onRadiusChange(parseInt(value))}>
            <SelectTrigger data-testid="select-radius">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="500">500m</SelectItem>
              <SelectItem value="1000">1km</SelectItem>
              <SelectItem value="2000">2km</SelectItem>
              <SelectItem value="5000">5km</SelectItem>
              <SelectItem value="10000">10km</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
