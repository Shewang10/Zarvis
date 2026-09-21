import { ToolDefinition, ToolContext, IntentType } from '../types.js';
import { calculatorTool } from './calculator.js';
import { newsSearchTool } from './newsSearch.js';
import { webSearchTool } from './webSearch.js';
import { weatherTool } from './weather.js';
import { memoryStoreTool } from './memoryStore.js';
import { memoryRecallTool } from './memoryRecall.js';
import { systemStatusTool } from './systemStatus.js';
import { timeTool } from './time.js';
import { databaseQueryTool } from './databaseQuery.js';

class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  constructor() {
    this.register(calculatorTool);
    this.register(newsSearchTool);
    this.register(webSearchTool);
    this.register(weatherTool);
    this.register(memoryStoreTool);
    this.register(memoryRecallTool);
    this.register(systemStatusTool);
    this.register(timeTool);
    this.register(databaseQueryTool);
  }

  public register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  public get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  public list(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  public async execute(name: string, input: any, context: ToolContext): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool "${name}" is not registered in JARVIS Core.`);
    }
    return tool.execute(input, context);
  }

  public routeIntent(query: string): {
    intent: IntentType;
    tools: Array<{ name: string; params: any }>;
  } {
    const q = query.trim().toLowerCase();

    // 1. Calculator intent (prioritize explicit math or math expressions)
    const isMath =
      /^(?:calculate|compute|what is|how much is)\s+[\d\s+\-*/().,x%^]+$/i.test(q) ||
      /\b(multiplied by|divided by|times|plus|minus|percent of|\^|sqrt|squared|cubed)\b/i.test(q) ||
      /^(?:calculate|compute)\b/i.test(q) ||
      /^\d+\s*[\+\-\*\/x]\s*\d+/.test(q);

    if (isMath) {
      const expr = query
        .replace(/^(?:hey\s+)?jarvis,?\s*/i, '')
        .replace(/^(?:calculate|compute|what is|how much is)\s+/i, '')
        .trim();
      return {
        intent: 'CALCULATOR',
        tools: [{ name: 'calculator', params: { expression: expr || query } }],
      };
    }

    // 2. Memory Store intent ("remember that...", "note that...", "save memory...")
    if (/\b(?:remember that|remember:|remember|note that|store that)\b/i.test(q) && !/\b(?:what do you remember|do you remember)\b/i.test(q)) {
      const fact = query
        .replace(/^(?:hey\s+)?jarvis,?\s*/i, '')
        .replace(/^(?:please\s+)?(?:remember that|remember|note that|store that)\s+/i, '')
        .trim();

      // Extract key if present (e.g. "my project is called CleanFleet" -> CleanFleet)
      let key = '';
      const keyMatch = fact.match(/(?:project is called|project name is|named|called)\s+([A-Za-z0-9_ -]+)/i);
      if (keyMatch) {
        key = keyMatch[1].trim();
      }

      return {
        intent: 'MEMORY_STORE',
        tools: [{ name: 'memoryStore', params: { fact, key: key || undefined } }],
      };
    }

    // 3. Memory Recall intent ("what do you remember about...", "what is my project called", etc.)
    if (
      /\b(?:what do you remember|do you remember|recall|what did i say about|what is my .* called|what was my project)\b/i.test(q)
    ) {
      const term = query
        .replace(/^(?:hey\s+)?jarvis,?\s*/i, '')
        .replace(/^(?:what do you remember about|do you remember|recall|what is my|what was my)\s+/i, '')
        .replace(/(?:project called|called|project)\??$/i, '')
        .trim();

      return {
        intent: 'MEMORY_RECALL',
        tools: [{ name: 'memoryRecall', params: { query: term || query } }],
      };
    }

    // 4. Time / World Clock
    if (/\b(?:what time is it|current time|what is the time|what day is it|what is the date|what is today's date)\b/i.test(q)) {
      let location = '';
      const inMatch = q.match(/\bin\s+([a-zA-Z\s]+)/i);
      if (inMatch) location = inMatch[1].trim();

      return {
        intent: 'TIME',
        tools: [{ name: 'time', params: { location } }],
      };
    }

    // 5. Weather
    if (/\b(?:weather|temperature|forecast|is it raining|is it hot|is it cold)\b/i.test(q)) {
      let location = 'Current Location';
      const locMatch = q.match(/(?:weather in|weather for|forecast for|temperature in)\s+([a-zA-Z\s]+)/i);
      if (locMatch) location = locMatch[1].trim();

      return {
        intent: 'WEATHER',
        tools: [{ name: 'weather', params: { location } }],
      };
    }

    // 6. Database / Conversation history ("show me the last five things I asked you")
    if (/\b(?:last (?:few|\d+|five) things|previous questions|conversation history|what did i ask)\b/i.test(q)) {
      const numMatch = q.match(/\b(\d+)\b/);
      const limit = numMatch ? parseInt(numMatch[1], 10) : 5;
      return {
        intent: 'DATABASE_QUERY',
        tools: [{ name: 'databaseQuery', params: { target: 'conversations', limit } }],
      };
    }

    // 7. System Status / Health
    if (/\b(?:system status|diagnostics|system health|telemetry|cpu status|hardware status)\b/i.test(q)) {
      return {
        intent: 'SYSTEM_STATUS',
        tools: [{ name: 'systemStatus', params: {} }],
      };
    }

    // 8. News search (prioritize if user specifically asks for news or headlines)
    if (/\b(?:news|headlines|latest updates)\b/i.test(q)) {
      const topic = query
        .replace(/^(?:hey\s+)?jarvis,?\s*/i, '')
        .replace(/^(?:what are the|search for the|show me the|get me the|what is the)\s+/i, '')
        .replace(/\b(?:today|latest|news|today's)\b/gi, '')
        .trim();

      return {
        intent: 'NEWS_SEARCH',
        tools: [{ name: 'newsSearch', params: { query: topic || 'AI technology', limit: 4 } }],
      };
    }

    // 9. Web search ("search the web for...", "google...", "look up...", "search for...")
    if (/\b(?:search the web|search web|search for|look up|find information on|who is|what is|tell me about)\b/i.test(q)) {
      const topic = query
        .replace(/^(?:hey\s+)?jarvis,?\s*/i, '')
        .replace(/^(?:search the web for|search web for|search for|look up|find information on)\s+/i, '')
        .trim();

      return {
        intent: 'WEB_SEARCH',
        tools: [{ name: 'webSearch', params: { query: topic || query, limit: 4 } }],
      };
    }

    // Default: Web search or general synthesis
    return {
      intent: 'WEB_SEARCH',
      tools: [{ name: 'webSearch', params: { query, limit: 3 } }],
    };
  }
}

export const toolRegistry = new ToolRegistry();

