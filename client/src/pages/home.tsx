import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { authStorage, getAuthHeaders } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { Map } from "@/components/Map";
import { PlaceCard } from "@/components/PlaceCard";
import { SearchFilters } from "@/components/SearchFilters";
import { LocationInput } from "@/components/LocationInput";
import { Place, SearchHistory } from "@shared/schema";
import { Location, PlaceFilters } from "@/lib/types";
import { 
  Menu, 
  Search, 
  User, 
  Filter, 
  RotateCcw,
  X,
  LogOut,
  MapPin
} from "lucide-react";

export default function Home() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  // State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState<Location | null>(null);
  const [radius, setRadius] = useState(2000);
  const [filters, setFilters] = useState<PlaceFilters>({ sortBy: 'distance' });
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [user, setUser] = useState(authStorage.getUser());

  // Sync user state with localStorage changes
  useEffect(() => {
    const syncUser = () => {
      setUser(authStorage.getUser());
    };
    
    // Listen for storage changes
    window.addEventListener('storage', syncUser);
    return () => window.removeEventListener('storage', syncUser);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  // Search history query
  const { data: searchHistoryData } = useQuery<{ history: SearchHistory[] }>({
    queryKey: ['/api/search-history'],
    enabled: !!user,
  });

  // Places query
  const { data: placesData, isLoading: placesLoading, error: placesError } = useQuery({
    queryKey: ['/api/places/nearby', location?.lat, location?.lng, radius, filters.category],
    enabled: !!location,
    queryFn: async () => {
      const params = new URLSearchParams({
        lat: location!.lat.toString(),
        lng: location!.lng.toString(),
        radius: radius.toString(),
      });
      
      if (filters.category && filters.category !== "All Categories") {
        params.append('type', filters.category.toLowerCase());
      }

      const authHeaders = getAuthHeaders();
      const response = await fetch(`/api/places/nearby?${params}`, {
        headers: authHeaders.Authorization ? { Authorization: authHeaders.Authorization } : {},
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch places');
      }
      
      return response.json();
    },
  });

  // Search mutation for text search
  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      const params = new URLSearchParams({ query });
      
      if (location) {
        params.append('lat', location.lat.toString());
        params.append('lng', location.lng.toString());
      }

      const response = await apiRequest("GET", `/api/places/search?${params}`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/places/nearby', location?.lat, location?.lng, radius], data);
      
      // Save to search history
      if (searchQuery.trim()) {
        saveSearchHistory.mutate({
          query: searchQuery,
          location: location?.address || `${location?.lat}, ${location?.lng}` || '',
          radius: radius.toString(),
          filters,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Search failed",
        description: error.message || "Failed to search places",
        variant: "destructive",
      });
    },
  });

  // Save search history mutation
  const saveSearchHistory = useMutation({
    mutationFn: async (historyData: any) => {
      const response = await apiRequest("POST", "/api/search-history", historyData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/search-history'] });
    },
  });

  // Remove search history mutation
  const removeSearchHistory = useMutation({
    mutationFn: async (historyId: string) => {
      const response = await apiRequest("DELETE", `/api/search-history/${historyId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/search-history'] });
    },
  });

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Enter search query",
        description: "Please enter a search term to find places.",
      });
      return;
    }

    searchMutation.mutate(searchQuery);
  };

  const handleSearchHistoryClick = (history: SearchHistory) => {
    setSearchQuery(history.query);
    searchMutation.mutate(history.query);
  };

  const handleLogout = () => {
    authStorage.clear();
    setUser(null);
    navigate("/login");
  };

  const sortPlaces = (places: Place[]): Place[] => {
    if (!places) return [];

    let sorted = [...places];

    // Apply filters
    if (filters.category && filters.category !== "All Categories") {
      sorted = sorted.filter(place => 
        (place.aiCategory || place.category)?.toLowerCase().includes(filters.category!.toLowerCase())
      );
    }

    if (filters.rating) {
      sorted = sorted.filter(place => 
        place.rating && parseFloat(place.rating) >= filters.rating!
      );
    }

    if (filters.priceLevel && filters.priceLevel.length > 0) {
      sorted = sorted.filter(place => 
        place.priceLevel && filters.priceLevel!.includes(place.priceLevel)
      );
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'rating':
        sorted.sort((a, b) => {
          const ratingA = parseFloat(a.rating || '0');
          const ratingB = parseFloat(b.rating || '0');
          return ratingB - ratingA;
        });
        break;
      case 'distance':
        if (location) {
          sorted.sort((a, b) => {
            const distA = calculateDistance(location, a);
            const distB = calculateDistance(location, b);
            return distA - distB;
          });
        }
        break;
      // Add more sorting options as needed
    }

    return sorted;
  };

  const calculateDistance = (center: Location, place: Place): number => {
    if (!place.latitude || !place.longitude) return Infinity;
    
    const lat1 = center.lat;
    const lng1 = center.lng;
    const lat2 = parseFloat(place.latitude);
    const lng2 = parseFloat(place.longitude);
    
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lng2-lng1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  const places = sortPlaces(placesData?.places || []);

  if (!user) {
    return <div>Redirecting...</div>;
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Location Input */}
      <LocationInput
        location={location}
        radius={radius}
        onLocationChange={setLocation}
        onRadiusChange={setRadius}
      />

      {/* Search Filters */}
      <SearchFilters
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Search History */}
      <div className="p-4 flex-1 overflow-y-auto">
        <h3 className="font-semibold mb-3">Recent Searches</h3>
        <div className="space-y-2">
          {searchHistoryData?.history && searchHistoryData.history.length > 0 ? (
            searchHistoryData.history.slice(0, 10).map((history: SearchHistory) => (
              <div
                key={history.id}
                className="flex items-center justify-between p-2 hover:bg-muted rounded-md cursor-pointer group"
                onClick={() => handleSearchHistoryClick(history)}
                data-testid={`history-item-${history.id}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{history.query}</p>
                  <p className="text-xs text-muted-foreground">
                    {history.timestamp ? new Date(history.timestamp).toLocaleDateString() : 'Unknown date'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSearchHistory.mutate(history.id);
                  }}
                  data-testid={`button-remove-history-${history.id}`}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No recent searches</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-4">
          {isMobile && (
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" data-testid="button-menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <SidebarContent />
              </SheetContent>
            </Sheet>
          )}
          <div className="flex items-center space-x-2">
            <MapPin className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-primary">FinD-ora</h1>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {!isMobile && (
            <div className="relative">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search places..."
                className="pl-10 pr-4 w-64"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                data-testid="input-search"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          )}

          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUserMenu(!showUserMenu)}
              data-testid="button-user-menu"
            >
              <User className="h-5 w-5" />
            </Button>
            
            {showUserMenu && (
              <Card className="absolute right-0 top-full mt-2 w-48 z-50">
                <CardContent className="p-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={handleLogout}
                      data-testid="button-logout"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <div className="w-80 bg-card border-r border-border flex flex-col">
            <SidebarContent />
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Map */}
          <div className="flex-1 relative">
            {location ? (
              <Map
                center={location}
                places={places}
                onPlaceSelect={setSelectedPlace}
                className="h-full"
              />
            ) : (
              <div className="h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <div className="text-center text-white">
                  <MapPin className="h-16 w-16 mx-auto mb-4 opacity-80" />
                  <p className="text-xl font-medium">Set your location to start discovering</p>
                  <p className="text-sm opacity-80 mt-2">Use the sidebar to enter your location</p>
                </div>
              </div>
            )}
          </div>

          {/* Places List */}
          <div className="w-full md:w-96 bg-card border-l border-border overflow-y-auto">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Found Places</h3>
                <span className="text-sm text-muted-foreground" data-testid="text-places-count">
                  {places.length} results
                </span>
              </div>

              {isMobile && (
                <div className="flex space-x-2 mb-3">
                  <div className="relative flex-1">
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search places..."
                      className="pl-10"
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      data-testid="input-search-mobile"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                  <Button onClick={handleSearch} disabled={searchMutation.isPending} data-testid="button-search-mobile">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {(placesLoading || searchMutation.isPending) && (
                <div className="bg-muted p-3 rounded-md mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                    <span className="text-sm">
                      {searchMutation.isPending ? "Searching places..." : "Loading places..."}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 space-y-4">
              {placesError ? (
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-destructive">Failed to load places</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/places/nearby'] })}
                      data-testid="button-retry"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  </CardContent>
                </Card>
              ) : places.length === 0 && !placesLoading ? (
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-muted-foreground">
                      {location ? "No places found in this area" : "Set your location to find places"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                places.map((place) => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    distance={location ? calculateDistance(location, place) : undefined}
                    onSelect={setSelectedPlace}
                  />
                ))
              )}

              {placesLoading && (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <Skeleton className="h-32 w-full mb-4" />
                        <Skeleton className="h-4 w-3/4 mb-2" />
                        <Skeleton className="h-3 w-1/2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile FABs */}
      {isMobile && (
        <div className="fixed bottom-6 right-6 flex flex-col space-y-3">
          <Button
            size="lg"
            className="rounded-full shadow-lg"
            onClick={() => setShowUserMenu(!showUserMenu)}
            data-testid="fab-search"
          >
            <Search className="h-6 w-6" />
          </Button>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="secondary"
                size="lg"
                className="rounded-full shadow-lg"
                data-testid="fab-filters"
              >
                <Filter className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-96">
              <SearchFilters filters={filters} onFiltersChange={setFilters} />
            </SheetContent>
          </Sheet>
        </div>
      )}
    </div>
  );
}
