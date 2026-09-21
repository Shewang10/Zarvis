import { ToolDefinition, MemoryRecord } from '../types.js';
import { memoryRepo } from '../db/index.js';

interface MemoryRecallInput {
  query?: string;
  key?: string;
  category?: string;
}

interface MemoryRecallOutput {
  found: boolean;
  query: string;
  memories: MemoryRecord[];
  summary: string;
}

export const memoryRecallTool: ToolDefinition<MemoryRecallInput, MemoryRecallOutput> = {
  name: 'memoryRecall',
  description: 'Searches and retrieves structured persistent memories stored by the user.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search term or concept to recall (e.g. "CleanFleet", "project", "preferences")',
      },
      key: {
        type: 'string',
        description: 'Exact key to match if known',
      },
    },
  },
  execute: async ({ query = '', key }) => {
    let memories: MemoryRecord[] = [];

    // Strip common question punctuation and prefixes
    const cleanTerm = query
      .replace(/[\?\!\.,;:"']/g, '')
      .replace(/(?:what do you remember about|what is my|remember about|do you remember|recall|what was my)\s+/gi, '')
      .replace(/\b(?:called|project)\b/gi, '')
      .trim();

    if (key) {
      const exact = memoryRepo.getByKey(key);
      if (exact) memories = [exact];
    }

    if (memories.length === 0 && cleanTerm) {
      memories = memoryRepo.search(cleanTerm);
    }

    if (memories.length === 0 && query) {
      memories = memoryRepo.search(query.replace(/[\?\!\.,;:"']/g, '').trim());
    }

    // If query was empty or no match, list recent memories
    if (memories.length === 0 && !cleanTerm) {
      memories = memoryRepo.list(10);
    }

    if (memories.length === 0) {
      return {
        found: false,
        query,
        memories: [],
        summary: `I have no recorded memories matching "${query}" in the database.`,
      };
    }

    const summary = memories
      .map((m) => `• ${m.key}: ${m.content}`)
      .join('\n');

    return {
      found: true,
      query,
      memories,
      summary: `Found ${memories.length} relevant record${memories.length > 1 ? 's' : ''}:\n${summary}`,
    };
  },
};
