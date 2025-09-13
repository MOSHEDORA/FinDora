import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Clock } from "lucide-react";
import { Place } from "@shared/schema";

interface PlaceCardProps {
  place: Place;
  distance?: number;
  onSelect?: (place: Place) => void;
}

export function PlaceCard({ place, distance, onSelect }: PlaceCardProps) {
  const handleClick = () => {
    onSelect?.(place);
  };

  const renderPriceLevel = (level: number | null) => {
    if (!level) return null;
    return "$".repeat(level);
  };

  const formatDistance = (dist?: number) => {
    if (!dist) return null;
    return dist < 1000 ? `${Math.round(dist)}m` : `${(dist / 1000).toFixed(1)}km`;
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1" 
      onClick={handleClick}
      data-testid={`card-place-${place.id}`}
    >
      <CardContent className="p-0">
        {place.photoUrl && (
          <img
            src={place.photoUrl}
            alt={place.name}
            className="w-full h-32 object-cover rounded-t-lg"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
        
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold text-foreground truncate flex-1" data-testid={`text-place-name-${place.id}`}>
              {place.name}
            </h4>
            {place.rating && (
              <div className="flex items-center space-x-1 ml-2">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-sm text-muted-foreground" data-testid={`text-rating-${place.id}`}>
                  {place.rating}
                </span>
              </div>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground mb-2" data-testid={`text-category-${place.id}`}>
            {place.aiCategory || place.category}
            {place.priceLevel && (
              <span className="ml-2">• {renderPriceLevel(place.priceLevel)}</span>
            )}
          </p>
          
          <div className="flex items-center space-x-4 text-xs text-muted-foreground mb-3">
            {(distance || place.latitude) && (
              <div className="flex items-center space-x-1">
                <MapPin className="h-3 w-3 text-accent" />
                <span data-testid={`text-distance-${place.id}`}>
                  {distance ? formatDistance(distance) : "Location"}
                </span>
              </div>
            )}
            {place.isOpen !== null && (
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span className={place.isOpen ? "text-green-600" : "text-red-600"}>
                  {place.isOpen ? "Open" : "Closed"}
                </span>
              </div>
            )}
          </div>
          
          {place.aiTags && place.aiTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {place.aiTags.slice(0, 3).map((tag, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="text-xs"
                  data-testid={`badge-tag-${place.id}-${index}`}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
