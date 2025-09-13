import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, 
  Star, 
  Clock, 
  Phone, 
  Globe, 
  DollarSign,
  MessageSquare,
  Menu as MenuIcon,
  X,
  Navigation,
  Info
} from "lucide-react";
import { Place } from "@shared/schema";

interface PlaceDetailsProps {
  place: Place | null;
  isOpen: boolean;
  onClose: () => void;
  distance?: number;
}

export function PlaceDetails({ place, isOpen, onClose, distance }: PlaceDetailsProps) {
  if (!place) return null;

  const formatDistance = (dist?: number) => {
    if (!dist) return null;
    return dist < 1000 ? `${Math.round(dist)}m` : `${(dist / 1000).toFixed(1)}km`;
  };

  const renderPriceLevel = (level: number | null) => {
    if (!level) return "Data Not Available";
    return "$".repeat(level);
  };

  const DataRow = ({ 
    icon: Icon, 
    label, 
    value, 
    fallback = "Data Not Available" 
  }: { 
    icon: React.ElementType; 
    label: string; 
    value: any; 
    fallback?: string; 
  }) => (
    <div className="flex items-start space-x-3 py-2">
      <Icon className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="text-sm text-muted-foreground">
          {value || <span className="text-gray-400 italic">{fallback}</span>}
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <DialogTitle className="text-xl font-bold pr-4">
              {place.name}
            </DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="sm" className="flex-shrink-0">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Main Info */}
          <div>
            {place.photoUrl && (
              <img
                src={place.photoUrl}
                alt={place.name}
                className="w-full h-48 object-cover rounded-lg mb-4"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            
            <div className="flex items-center justify-between mb-2">
              <Badge variant="secondary" className="text-sm">
                {place.aiCategory || place.category || 'Category: Data Not Available'}
              </Badge>
              {place.rating && (
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="font-medium">{place.rating}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Location & Contact */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Info className="h-5 w-5" />
                <span>Basic Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <DataRow 
                icon={MapPin} 
                label="Address" 
                value={place.address}
              />
              
              <DataRow 
                icon={Navigation} 
                label="Distance" 
                value={distance ? formatDistance(distance) : null}
                fallback="Distance calculation unavailable"
              />
              
              <DataRow 
                icon={DollarSign} 
                label="Price Level" 
                value={place.priceLevel ? renderPriceLevel(place.priceLevel) : null}
              />
              
              <DataRow 
                icon={Clock} 
                label="Status" 
                value={place.isOpen !== null ? (place.isOpen ? "Open" : "Closed") : null}
              />
              
              <DataRow 
                icon={Star} 
                label="Business Status" 
                value={place.businessStatus}
              />
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Phone className="h-5 w-5" />
                <span>Contact Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <DataRow 
                icon={Phone} 
                label="Phone Number" 
                value={null} // OpenTripMap doesn't provide phone numbers
                fallback="Phone number not available from this data source"
              />
              
              <DataRow 
                icon={Globe} 
                label="Website" 
                value={null} // OpenTripMap doesn't provide websites
                fallback="Website not available from this data source"
              />
            </CardContent>
          </Card>

          {/* Reviews & Comments */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Reviews & Comments</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-center italic">
                    Comments and detailed reviews are not available from this data source. 
                    For comprehensive reviews, please check Google Maps, Yelp, or other review platforms.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Menu Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <MenuIcon className="h-5 w-5" />
                <span>Menu Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-center italic">
                    Menu information is not available from this data source. 
                    Please contact the establishment directly or visit their website for menu details.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Tags */}
          {place.aiTags && place.aiTags.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {place.aiTags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Technical Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Technical Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <DataRow 
                icon={Info} 
                label="Place ID" 
                value={place.id}
              />
              
              <DataRow 
                icon={MapPin} 
                label="Coordinates" 
                value={place.latitude && place.longitude ? `${place.latitude}, ${place.longitude}` : null}
              />
              
              <DataRow 
                icon={Info} 
                label="Types" 
                value={place.types?.join(', ')}
              />
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}