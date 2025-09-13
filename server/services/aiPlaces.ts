import OpenAI from "openai";
import { Place } from '@shared/schema';

export class AIPlacesService {
  private openai?: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.log('[AI Places Service] OpenAI API key not configured - AI features disabled');
      return;
    }
    this.openai = new OpenAI({ apiKey });
  }

  async enhancedCategorySearch(
    category: string, 
    lat: number, 
    lng: number, 
    radius: number, 
    places: Place[]
  ): Promise<Place[]> {
    if (!this.openai) {
      console.log('[AI Places Service] OpenAI not configured - returning original places');
      return places;
    }

    try {
      // Use AI to analyze and rank places based on category relevance
      const prompt = `You are a travel and places expert. Given the category "${category}" and the following places near coordinates ${lat}, ${lng}, please:

1. Rank the places by relevance to the "${category}" category
2. Filter to only the most relevant places (top 20)
3. Enhance each place with appropriate AI-generated tags
4. Return results in JSON format

Places data:
${JSON.stringify(places.slice(0, 50), null, 2)} // Limit to avoid token limits

Response format:
{
  "enhanced_places": [
    {
      "id": "place_id",
      "relevance_score": 0.85,
      "ai_tags": ["tag1", "tag2", "tag3"],
      "ai_category": "enhanced_category_name"
    }
  ]
}

Focus on places that are genuinely relevant to "${category}". Include confidence scores from 0-1.`;

      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      const response = await this.openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system", 
            content: "You are a helpful assistant that analyzes places and provides relevant recommendations for travel and entertainment."
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        max_tokens: 2000
      });

      const result = JSON.parse(response.choices[0].message.content || '{"enhanced_places": []}');
      
      // Enhance original places with AI insights
      const enhancedPlaces = places.map(place => {
        const aiData = result.enhanced_places?.find((ep: any) => ep.id === place.id);
        if (aiData && aiData.relevance_score > 0.3) {
          return {
            ...place,
            aiCategory: aiData.ai_category || place.aiCategory,
            aiTags: aiData.ai_tags || place.aiTags || []
          };
        }
        return null;
      }).filter(Boolean) as Place[];

      // Sort by relevance score
      const sortedPlaces = enhancedPlaces.sort((a, b) => {
        const scoreA = result.enhanced_places?.find((ep: any) => ep.id === a.id)?.relevance_score || 0;
        const scoreB = result.enhanced_places?.find((ep: any) => ep.id === b.id)?.relevance_score || 0;
        return scoreB - scoreA;
      });

      console.log(`[AI Places Service] Enhanced ${sortedPlaces.length} places for category "${category}"`);
      return sortedPlaces.slice(0, 20); // Return top 20 most relevant

    } catch (error) {
      console.error('[AI Places Service] Error enhancing places:', error);
      return places; // Return original places on error
    }
  }

  async generatePlaceRecommendations(category: string, lat: number, lng: number): Promise<string[]> {
    if (!this.openai) {
      return [];
    }

    try {
      const prompt = `Generate 5-10 specific place names or types that would be excellent for someone looking for "${category}" near coordinates ${lat}, ${lng}. 

Consider the local area and provide realistic suggestions that might exist in this location.

Return as JSON array of strings:
["suggestion1", "suggestion2", "suggestion3"]`;

      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      const response = await this.openai.chat.completions.create({
        model: "gpt-5",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 300
      });

      const result = JSON.parse(response.choices[0].message.content || '[]');
      return Array.isArray(result) ? result : result.suggestions || [];

    } catch (error) {
      console.error('[AI Places Service] Error generating recommendations:', error);
      return [];
    }
  }
}

export const aiPlacesService = new AIPlacesService();