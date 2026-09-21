import { ToolDefinition, MemoryRecord } from '../types.js';
import { memoryRepo } from '../db/index.js';

interface MemoryStoreInput {
  key?: string;
  fact: string;
  category?: string;
  tags?: string[];
}

interface MemoryStoreOutput {
  stored: boolean;
  memory: MemoryRecord;
  message: string;
}

export const memoryStoreTool: ToolDefinition<MemoryStoreInput, MemoryStoreOutput> = {
  name: 'memoryStore',
  description: 'Persistently stores user facts, preferences, project names, credentials metadata, or instructions in structured memory.',
  parameters: {
    type: 'object',
    properties: {
      key: {
        type: 'string',
        description: 'Key or identifier for the memory (e.g. "CleanFleet", "project_name", "user_favorite_color")',
      },
      fact: {
        type: 'string',
        description: 'The fact or information to remember',
      },
      category: {
        type: 'string',
        description: 'Category: "project", "personal", "task", "system", "general"',
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional tags for indexing',
      },
    },
    required: ['fact'],
  },
  execute: async ({ key, fact, category = 'general', tags = [] }) => {
    // Derive key if not provided
    let derivedKey = key;
    if (!derivedKey) {
      const match = fact.match(/(?:project is called|project name is|name is|remember that|remember)\s+([A-Za-z0-9_ -]+)/i);
      derivedKey = match ? match[1].trim() : fact.slice(0, 30).trim();
    }

    // Auto extract tags
    const extractedTags = Array.from(new Set([...tags, derivedKey.toLowerCase()]));

    const record = memoryRepo.save(derivedKey, fact, category, extractedTags);

    return {
      stored: true,
      memory: record,
      message: `Memory committed to neural storage: "${fact}" [Key: ${derivedKey}]`,
    };
  },
};

