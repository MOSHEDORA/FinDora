import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PlaceFilters } from "@/lib/types";

interface SearchFiltersProps {
  filters: PlaceFilters;
  onFiltersChange: (filters: PlaceFilters) => void;
}

const CATEGORIES = [
  "All Categories",
  "Restaurant",
  "Cafe", 
  "Bar",
  "Shopping",
  "Entertainment",
  "Health & Fitness",
  "Services",
  "Lodging",
  "Other"
];

const PRICE_LEVELS = [
  { value: 1, label: "$" },
  { value: 2, label: "$$" },
  { value: 3, label: "$$$" },
  { value: 4, label: "$$$$" }
];

export function SearchFilters({ filters, onFiltersChange }: SearchFiltersProps) {
  const [selectedPriceLevels, setSelectedPriceLevels] = useState<number[]>(filters.priceLevel || []);

  const updateFilters = (updates: Partial<PlaceFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const togglePriceLevel = (level: number) => {
    const newLevels = selectedPriceLevels.includes(level)
      ? selectedPriceLevels.filter(l => l !== level)
      : [...selectedPriceLevels, level];
    
    setSelectedPriceLevels(newLevels);
    updateFilters({ priceLevel: newLevels.length > 0 ? newLevels : undefined });
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold mb-3">Filters</h3>
        <div className="space-y-4">
          <div>
            <Label className="block text-sm font-medium mb-2">Category</Label>
            <Select 
              value={filters.category || "All Categories"} 
              onValueChange={(value) => updateFilters({ category: value === "All Categories" ? undefined : value })}
            >
              <SelectTrigger data-testid="select-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="block text-sm font-medium mb-2">Rating</Label>
            <Select 
              value={filters.rating?.toString() || "0"} 
              onValueChange={(value) => updateFilters({ rating: value === "0" ? undefined : parseFloat(value) })}
            >
              <SelectTrigger data-testid="select-rating">
                <SelectValue placeholder="Any Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Any Rating</SelectItem>
                <SelectItem value="4">4+ Stars</SelectItem>
                <SelectItem value="3">3+ Stars</SelectItem>
                <SelectItem value="2">2+ Stars</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="block text-sm font-medium mb-2">Price Range</Label>
            <div className="flex space-x-2">
              {PRICE_LEVELS.map(({ value, label }) => (
                <Button
                  key={value}
                  variant={selectedPriceLevels.includes(value) ? "default" : "outline"}
                  size="sm"
                  onClick={() => togglePriceLevel(value)}
                  data-testid={`button-price-${value}`}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sort Options */}
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold mb-3">Sort By</h3>
        <RadioGroup 
          value={filters.sortBy || "distance"} 
          onValueChange={(value) => updateFilters({ sortBy: value as PlaceFilters['sortBy'] })}
          data-testid="radio-sort"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="distance" id="distance" />
            <Label htmlFor="distance" className="text-sm">Nearest Distance</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="rating" id="rating" />
            <Label htmlFor="rating" className="text-sm">Highest Rating</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="popularity" id="popularity" />
            <Label htmlFor="popularity" className="text-sm">Most Popular</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="reviews" id="reviews" />
            <Label htmlFor="reviews" className="text-sm">Most Reviews</Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
}
