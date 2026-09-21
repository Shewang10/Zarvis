import { ToolDefinition, ConversationRecord } from '../types.js';
import { conversationRepo, memoryRepo } from '../db/index.js';

interface DatabaseQueryInput {
  target?: 'conversations' | 'memories' | 'all';
  limit?: number;
}

interface DatabaseQueryOutput {
  target: string;
  totalReturned: number;
  conversations?: ConversationRecord[];
  summary: string;
}

export const databaseQueryTool: ToolDefinition<DatabaseQueryInput, DatabaseQueryOutput> = {
  name: 'databaseQuery',
  description: 'Queries persistent logs and records such as previous questions, recent interactions, and database statistics.',
  parameters: {
    type: 'object',
    properties: {
      target: {
        type: 'string',
        enum: ['conversations', 'memories', 'all'],
        description: 'What records to query',
      },
      limit: {
        type: 'number',
        description: 'Number of records to retrieve (default: 5)',
      },
    },
  },
  execute: async ({ target = 'conversations', limit = 5 }) => {
    const lim = Math.max(1, Math.min(limit || 5, 20));

    if (target === 'conversations' || target === 'all') {
      const records = conversationRepo.list(lim);

      if (records.length === 0) {
        return {
          target,
          totalReturned: 0,
          conversations: [],
          summary: 'No previous conversations recorded in this session or database yet.',
        };
      }

      const summary = records
        .map((r, i) => `${i + 1}. "${r.userQuery}" → ${r.responseText.slice(0, 60)}...`)
        .join('\n');

      return {
        target: 'conversations',
        totalReturned: records.length,
        conversations: records,
        summary: `Here are the last ${records.length} interactions:\n${summary}`,
      };
    }

    const memories = memoryRepo.list(lim);
    return {
      target: 'memories',
      totalReturned: memories.length,
      summary: `Found ${memories.length} stored memories in database.`,
    };
  },
};

