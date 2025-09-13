import { config } from '../config';
import { Place } from '@shared/schema';

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class AIService {
  private apiKey: string;

  constructor() {
    this.apiKey = config.openRouterApiKey;
    if (!this.apiKey) {
      throw new Error('OpenRouter API key is required');
    }
  }

  async categorizePlace(place: Place): Promise<{ category: string; tags: string[] }> {
    const prompt = `
Analyze this place and provide a more specific category and relevant tags:

Name: ${place.name}
Address: ${place.address}
Current Category: ${place.category}
Types: ${place.types?.join(', ')}
Rating: ${place.rating || 'N/A'}

Please respond with a JSON object containing:
1. "category": A more specific category (e.g., "Italian Restaurant", "Coffee Shop", "Fitness Center", "Electronics Store")
2. "tags": An array of 3-5 relevant tags (e.g., ["casual dining", "family-friendly", "takeout available"])

Keep the response concise and relevant to the place type.
`;

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://findora.app',
          'X-Title': 'FinD-ora Place Categorization'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3-haiku',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 200,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.statusText}`);
      }

      const data: OpenRouterResponse = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No response from AI service');
      }

      const parsed = JSON.parse(content);
      return {
        category: parsed.category || place.category || 'Other',
        tags: parsed.tags || []
      };
    } catch (error) {
      console.error('AI categorization error:', error);
      // Fallback to basic categorization
      return {
        category: place.category || 'Other',
        tags: []
      };
    }
  }

  async categorizePlaces(places: Place[]): Promise<Place[]> {
    const categorizedPlaces = await Promise.all(
      places.map(async (place) => {
        try {
          const { category, tags } = await this.categorizePlace(place);
          return {
            ...place,
            aiCategory: category,
            aiTags: tags
          };
        } catch (error) {
          console.error(`Error categorizing place ${place.name}:`, error);
          return place;
        }
      })
    );

    return categorizedPlaces;
  }
}

export const aiService = new AIService();
