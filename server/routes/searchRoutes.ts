/**
 * AI Search Routes
 * Defines routes for intelligent destination search
 */

import type { Express, Request, Response } from 'express';
import { aiSearchController } from '../controllers/searchController';

/**
 * TypeScript interface for authenticated request
 */
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

/**
 * Register AI search routes
 * 
 * @param app Express application instance
 * @param authenticateToken Authentication middleware function
 * @param sql PostgreSQL connection (from postgres library)
 */
export function registerSearchRoutes(
  app: Express,
  authenticateToken: (req: Request, res: Response, next: () => void) => void,
  sql: any
): void {
  /**
   * POST /api/ai-search
   * 
   * Authenticated endpoint for AI-powered destination search
   * 
   * Request body:
   * {
   *   "textQuery": "Find museums in Paris with high ratings"
   * }
   * 
   * Response:
   * {
   *   "aiFilters": {
   *     "category": "Museum",
   *     "locationContains": "Paris",
   *     "minRating": 4.0,
   *     "tags": []
   *   },
   *   "results": [...destinations]
   * }
   */
  app.post('/api/ai-search', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { textQuery } = req.body;

      if (!textQuery || typeof textQuery !== 'string' || textQuery.trim().length === 0) {
        res.status(400).json({ error: 'textQuery is required and must be a non-empty string' });
        return;
      }

      if (!req.user?.userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const userId = req.user.userId;

      // Define strict schema for LLM output
      const filterSchema: Record<string, any> = {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Destination category (e.g., "Museum", "Resort", "Restaurant", "Nature")',
          },
          locationContains: {
            type: 'string',
            description: 'Location name or partial location name to search for',
          },
          minRating: {
            type: 'number',
            description: 'Minimum rating (0-5)',
            minimum: 0,
            maximum: 5,
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of relevant tags or keywords',
          },
        },
      };

      // Construct prompt for LLM
      const prompt = `You are a travel destination search assistant. Analyze the following user query and extract structured search filters.

User Query: "${textQuery}"

Extract the following information if mentioned:
- category: The type of destination (Museum, Resort, Restaurant, Nature, or undefined if not specified)
- locationContains: Any location name or partial location name mentioned
- minRating: Minimum rating if the user mentions ratings, stars, or quality expectations
- tags: Relevant keywords or tags that could help match destinations

Return a JSON object with only the fields that are relevant. Use undefined for fields that are not mentioned.

Examples:
- "Find museums in Paris" -> { "category": "Museum", "locationContains": "Paris" }
- "Show me highly rated restaurants" -> { "category": "Restaurant", "minRating": 4.0 }
- "Nature spots with good ratings" -> { "category": "Nature", "minRating": 4.0 }
- "Places in Tokyo" -> { "locationContains": "Tokyo" }`;

      // Call LLM API (placeholder - replace with actual LLM service)
      const LLM_API = {
        async query(prompt: string, schema: Record<string, any>): Promise<any> {
          // Placeholder implementation
          console.log('🤖 LLM Query:', prompt);
          console.log('📋 Schema:', schema);
          
          // Mock response - replace with actual LLM call
          return {
            category: undefined,
            locationContains: undefined,
            minRating: undefined,
            tags: undefined,
          };
        },
      };

      const llmResponse = await LLM_API.query(prompt, filterSchema);

      // Validate and sanitize LLM response
      const aiFilters = {
        category:
          typeof llmResponse.category === 'string' && llmResponse.category.trim()
            ? llmResponse.category.trim()
            : undefined,
        locationContains:
          typeof llmResponse.locationContains === 'string' && llmResponse.locationContains.trim()
            ? llmResponse.locationContains.trim()
            : undefined,
        minRating:
          typeof llmResponse.minRating === 'number' &&
          !isNaN(llmResponse.minRating) &&
          llmResponse.minRating >= 0 &&
          llmResponse.minRating <= 5
            ? llmResponse.minRating
            : undefined,
        tags:
          Array.isArray(llmResponse.tags) && llmResponse.tags.length > 0
            ? llmResponse.tags.filter((tag: any) => typeof tag === 'string' && tag.trim()).map((tag: string) => tag.trim())
            : undefined,
      };

      // Build query using postgres template literal syntax
      // Start with base query
      let results: any[];

      if (aiFilters.category && aiFilters.locationContains && aiFilters.minRating !== undefined) {
        // All filters
        results = await sql`
          SELECT id, name, location, category, description, image, rating, visited, "createdAt", "updatedAt"
          FROM "Destination"
          WHERE "userId" = ${userId}
            AND category = ${aiFilters.category}
            AND LOWER(location) LIKE LOWER(${'%' + aiFilters.locationContains + '%'})
            AND rating >= ${aiFilters.minRating}
          ORDER BY rating DESC, "createdAt" DESC
        `;
      } else if (aiFilters.category && aiFilters.locationContains) {
        results = await sql`
          SELECT id, name, location, category, description, image, rating, visited, "createdAt", "updatedAt"
          FROM "Destination"
          WHERE "userId" = ${userId}
            AND category = ${aiFilters.category}
            AND LOWER(location) LIKE LOWER(${'%' + aiFilters.locationContains + '%'})
          ORDER BY rating DESC, "createdAt" DESC
        `;
      } else if (aiFilters.category && aiFilters.minRating !== undefined) {
        results = await sql`
          SELECT id, name, location, category, description, image, rating, visited, "createdAt", "updatedAt"
          FROM "Destination"
          WHERE "userId" = ${userId}
            AND category = ${aiFilters.category}
            AND rating >= ${aiFilters.minRating}
          ORDER BY rating DESC, "createdAt" DESC
        `;
      } else if (aiFilters.locationContains && aiFilters.minRating !== undefined) {
        results = await sql`
          SELECT id, name, location, category, description, image, rating, visited, "createdAt", "updatedAt"
          FROM "Destination"
          WHERE "userId" = ${userId}
            AND LOWER(location) LIKE LOWER(${'%' + aiFilters.locationContains + '%'})
            AND rating >= ${aiFilters.minRating}
          ORDER BY rating DESC, "createdAt" DESC
        `;
      } else if (aiFilters.category) {
        results = await sql`
          SELECT id, name, location, category, description, image, rating, visited, "createdAt", "updatedAt"
          FROM "Destination"
          WHERE "userId" = ${userId}
            AND category = ${aiFilters.category}
          ORDER BY rating DESC, "createdAt" DESC
        `;
      } else if (aiFilters.locationContains) {
        results = await sql`
          SELECT id, name, location, category, description, image, rating, visited, "createdAt", "updatedAt"
          FROM "Destination"
          WHERE "userId" = ${userId}
            AND LOWER(location) LIKE LOWER(${'%' + aiFilters.locationContains + '%'})
          ORDER BY rating DESC, "createdAt" DESC
        `;
      } else if (aiFilters.minRating !== undefined) {
        results = await sql`
          SELECT id, name, location, category, description, image, rating, visited, "createdAt", "updatedAt"
          FROM "Destination"
          WHERE "userId" = ${userId}
            AND rating >= ${aiFilters.minRating}
          ORDER BY rating DESC, "createdAt" DESC
        `;
      } else {
        // No filters, return all user destinations
        results = await sql`
          SELECT id, name, location, category, description, image, rating, visited, "createdAt", "updatedAt"
          FROM "Destination"
          WHERE "userId" = ${userId}
          ORDER BY rating DESC, "createdAt" DESC
        `;
      }

      // Handle tags search if present (search in description and name)
      if (aiFilters.tags && aiFilters.tags.length > 0) {
        const tagFiltered = results.filter((dest: any) => {
          const desc = (dest.description || '').toLowerCase();
          const name = (dest.name || '').toLowerCase();
          return aiFilters.tags!.some(tag => 
            desc.includes(tag.toLowerCase()) || name.includes(tag.toLowerCase())
          );
        });
        results = tagFiltered;
      }

      // Return response
      res.json({
        aiFilters,
        results: results || [],
      });
    } catch (error: any) {
      console.error('❌ Error in AI search route:', error);
      res.status(500).json({
        error: error.message || 'Failed to process AI search',
      });
    }
  });
}

