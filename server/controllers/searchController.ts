/**
 * AI Search Controller
 * Handles intelligent destination search using LLM integration
 */

import type { Request, Response } from 'express';

// Placeholder for LLM API integration
// In production, replace this with your actual LLM service (OpenAI, Anthropic, etc.)
const LLM_API = {
  async query(prompt: string, schema: Record<string, any>): Promise<any> {
    // Placeholder implementation
    // Replace with actual LLM API call
    // Example: OpenAI, Anthropic Claude, etc.
    
    // For now, return a mock response that matches the schema
    // In production, this would call your LLM service with the prompt and schema
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

/**
 * TypeScript interface for LLM output schema
 */
interface AISearchFilters {
  category?: string;
  locationContains?: string;
  minRating?: number;
  tags?: string[];
}

/**
 * TypeScript interface for search request body
 */
interface AISearchRequest {
  textQuery: string;
}

/**
 * TypeScript interface for search response
 */
interface AISearchResponse {
  aiFilters: AISearchFilters;
  results: any[];
}

/**
 * POST /api/ai-search
 * 
 * Takes a natural language query, uses LLM to extract structured filters,
 * and returns matching destinations
 */
export async function aiSearchController(
  req: Request & { user?: { userId: string } },
  res: Response
): Promise<void> {
  try {
    const { textQuery }: AISearchRequest = req.body;

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

    // Call LLM API
    const llmResponse = await LLM_API.query(prompt, filterSchema);

    // Validate and sanitize LLM response
    const aiFilters: AISearchFilters = {
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

    // Build Prisma-style where clause
    // Note: Since the server uses direct SQL, we'll build SQL conditions
    const whereConditions: string[] = [`"userId" = $1`];
    const queryParams: any[] = [userId];
    let paramIndex = 2;

    if (aiFilters.category) {
      whereConditions.push(`category = $${paramIndex}`);
      queryParams.push(aiFilters.category);
      paramIndex++;
    }

    if (aiFilters.locationContains) {
      whereConditions.push(`LOWER(location) LIKE LOWER($${paramIndex})`);
      queryParams.push(`%${aiFilters.locationContains}%`);
      paramIndex++;
    }

    if (aiFilters.minRating !== undefined) {
      whereConditions.push(`rating >= $${paramIndex}`);
      queryParams.push(aiFilters.minRating);
      paramIndex++;
    }

    // Note: Tags would require a tags column or a separate tags table
    // For now, we'll search in description if tags are provided
    if (aiFilters.tags && aiFilters.tags.length > 0) {
      const tagConditions = aiFilters.tags.map((tag, idx) => {
        whereConditions.push(`(LOWER(description) LIKE LOWER($${paramIndex}) OR LOWER(name) LIKE LOWER($${paramIndex}))`);
        queryParams.push(`%${tag}%`);
        paramIndex++;
      });
    }

    const whereClause = whereConditions.join(' AND ');

    // Return filters - the route handler will execute the query
    const response: AISearchResponse = {
      aiFilters,
      results: [], // Will be populated by the route handler
    };

    // Store query info in response for the route handler to use
    (response as any).__queryInfo = {
      whereClause,
      queryParams,
    };

    res.json(response);
  } catch (error: any) {
    console.error('❌ Error in AI search controller:', error);
    res.status(500).json({
      error: error.message || 'Failed to process AI search',
    });
  }
}

