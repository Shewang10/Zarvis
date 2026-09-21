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
import { emailTool, browserControlTool } from './emailAndBrowser.js';

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
    this.register(emailTool);
    this.register(browserControlTool);
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

    // 1. Email & Outlook Control (English + Hindi/Hinglish)
    const isEmail =
      /\b(?:open (?:my )?email|open outlook|check (?:my )?email|check (?:my )?mail|check inbox|compose email|send email|outlook open|mail kholo|email kholo|outlook kholo|mail check karo|email check karo)\b/i.test(q) ||
      /(?:ईमेल खोलो|मेरा ईमेल|आउटलुक खोलो|ईमेल दिखाओ|डाक खोलो|मेल खोलो|ईमेल|आउटलुक)/.test(q);

    if (isEmail) {
      return {
        intent: 'EMAIL',
        tools: [{ name: 'email', params: { action: 'open', target: 'outlook' } }],
      };
    }

    // 2. Specific Browser & App Control ("open youtube", "open github", "open google")
    const browserMatch =
      q.match(/\b(?:open|launch|kholo)\s+(youtube|github|google|twitter|linkedin|reddit)\b/i) ||
      q.match(/(?:खोलो)\s*(youtube|github|google|twitter|linkedin|reddit)/i) ||
      q.match(/(youtube|github|google|twitter|linkedin|reddit)\s*(?:खोलो)/i);

    if (browserMatch) {
      const site = (browserMatch[1] || browserMatch[2] || 'google').toLowerCase();
      const urlMap: Record<string, string> = {
        youtube: 'https://www.youtube.com',
        github: 'https://github.com',
        google: 'https://www.google.com',
        twitter: 'https://x.com',
        linkedin: 'https://www.linkedin.com',
        reddit: 'https://www.reddit.com',
      };
      return {
        intent: 'BROWSER_CONTROL',
        tools: [{ name: 'browserControl', params: { url: urlMap[site] || `https://www.${site}.com`, app: site } }],
      };
    }

    // 3. Calculator intent (English + Hindi/Hinglish math: हिसाब, जोड़ो, गुणा, भाग, calculate)
    const isMath =
      /^(?:calculate|compute|what is|how much is|hisab lagao|hisab karo)\s+[\d\s+\-*/().,x%^]+$/i.test(q) ||
      /\b(multiplied by|divided by|times|plus|minus|percent of|\^|sqrt|squared|cubed|hisab)\b/i.test(q) ||
      /(?:हिसाब करो|जोड़ो|गुणा|भाग)/.test(q) ||
      /^(?:calculate|compute)\b/i.test(q) ||
      /^\d+\s*[\+\-\*\/x]\s*\d+/.test(q);

    if (isMath) {
      const expr = query
        .replace(/^(?:hey\s+)?jarvis,?\s*/i, '')
        .replace(/^(?:calculate|compute|what is|how much is|hisab karo|hisab lagao)\s+/i, '')
        .replace(/(?:हिसाब करो|हिसाब लगाओ|जोड़ो|गुणा करो)/g, '')
        .replace(/calculate\s*karo/i, '')
        .trim();
      return {
        intent: 'CALCULATOR',
        tools: [{ name: 'calculator', params: { expression: expr || query } }],
      };
    }

    // 4. Memory Store intent (English + Hindi: "याद रखो", "याद रखना", "yaad rakho")
    const isMemoryStore =
      (/\b(?:remember that|remember:|remember|note that|store that|yaad rakho ki|yaad rakho|yaad rakhna)\b/i.test(q) ||
        /(?:याद रखो कि|यह याद रखो|याद रखो|याद रखना)/.test(q)) &&
      !/\b(?:what do you remember|do you remember|kya yaad hai|kya yaad)\b/i.test(q) &&
      !/(?:क्या याद है)/.test(q);

    if (isMemoryStore) {
      const fact = query
        .replace(/^(?:hey\s+)?jarvis,?\s*/i, '')
        .replace(/^(?:please\s+)?(?:remember that|remember|note that|store that|yaad rakho ki|yaad rakho|yaad rakhna)\s+/i, '')
        .replace(/(?:याद रखो कि|यह याद रखो|याद रखो|याद रखना)\s*/g, '')
        .trim();

      // Extract key if present
      let key = '';
      const keyMatch = fact.match(/(?:project is called|project name is|named|called|का नाम|नाम है)\s+([A-Za-z0-9_ -]+)/i);
      if (keyMatch) {
        key = keyMatch[1].trim();
      }

      return {
        intent: 'MEMORY_STORE',
        tools: [{ name: 'memoryStore', params: { fact, key: key || undefined } }],
      };
    }

    // 5. Memory Recall intent (English + Hindi: "क्या याद है", "kya yaad hai", "what do you remember")
    const isMemoryRecall =
      /\b(?:what do you remember|do you remember|recall|what did i say about|what is my .* called|what was my project|kya yaad hai|kya yaad)\b/i.test(q) ||
      /(?:क्या याद है|मुझे बताओ)/.test(q);

    if (isMemoryRecall) {
      const term = query
        .replace(/^(?:hey\s+)?jarvis,?\s*/i, '')
        .replace(/^(?:what do you remember about|do you remember|recall|what is my|what was my|kya yaad hai|kya yaad)\s+/i, '')
        .replace(/(?:क्या याद है|मुझे बताओ)\s*/g, '')
        .replace(/(?:project called|called|project)\??$/i, '')
        .trim();

      return {
        intent: 'MEMORY_RECALL',
        tools: [{ name: 'memoryRecall', params: { query: term || query } }],
      };
    }

    // 6. Time / World Clock (English + Hindi: "समय क्या है", "kitne baje", "waqt kya hai")
    const isTime =
      /\b(?:what time is it|current time|what is the time|what day is it|what is the date|what is today's date|samay kya hai|waqt kya hai|kitne baje)\b/i.test(q) ||
      /(?:समय क्या हुआ है|कितने बजे हैं|समय बताओ|वक़्त क्या है|समय क्या है|समय)/.test(q);

    if (isTime) {
      let location = '';
      const inMatch = q.match(/\bin\s+([a-zA-Z\s]+)/i);
      if (inMatch) location = inMatch[1].trim();

      return {
        intent: 'TIME',
        tools: [{ name: 'time', params: { location } }],
      };
    }

    // 7. Weather (English + Hindi: "मौसम", "तापमान", "बारिश", "mausam", "tapman")
    const isWeather =
      /\b(?:weather|temperature|forecast|is it raining|is it hot|is it cold|mausam|tapman|barish)\b/i.test(q) ||
      /(?:मौसम|तापमान|बारिश)/.test(q);

    if (isWeather) {
      let location = 'Current Location';
      const locMatch = q.match(/(?:weather in|weather for|forecast for|temperature in|mausam in|mein mausam|में मौसम)\s+([a-zA-Z\s]+)/i);
      if (locMatch) location = locMatch[1].trim();

      return {
        intent: 'WEATHER',
        tools: [{ name: 'weather', params: { location } }],
      };
    }

    // 8. Database / Conversation history
    const isHistory =
      /\b(?:last (?:few|\d+|five) things|previous questions|conversation history|what did i ask|pichli baatein)\b/i.test(q) ||
      /(?:पिछली बातें)/.test(q);

    if (isHistory) {
      const numMatch = q.match(/\b(\d+)\b/);
      const limit = numMatch ? parseInt(numMatch[1], 10) : 5;
      return {
        intent: 'DATABASE_QUERY',
        tools: [{ name: 'databaseQuery', params: { target: 'conversations', limit } }],
      };
    }

    // 9. System Status / Health
    const isSystemStatus =
      /\b(?:system status|diagnostics|system health|telemetry|cpu status|hardware status)\b/i.test(q) ||
      /(?:सिस्टम स्टेटस|सिस्टम की स्थिति)/.test(q);

    if (isSystemStatus) {
      return {
        intent: 'SYSTEM_STATUS',
        tools: [{ name: 'systemStatus', params: {} }],
      };
    }

    // 10. News search (English + Hindi: "ताज़ा खबरें", "समाचार", "news", "khabrein")
    const isNews =
      /\b(?:news|headlines|latest updates|khabar|khabrein|samachar)\b/i.test(q) ||
      /(?:ताज़ा खबरें|ताज़ा खबरें|खबरें|समाचार|खबर)/.test(q);

    if (isNews) {
      const topic = query
        .replace(/^(?:hey\s+)?jarvis,?\s*/i, '')
        .replace(/^(?:what are the|search for the|show me the|get me the|what is the|aaj ki|dikhayein|batao)\s+/i, '')
        .replace(/(?:दिखाओ|बताओ|ताज़ा खबरें|ताज़ा खबरें|खबरें|समाचार|खबर)/g, '')
        .replace(/\b(?:today|latest|news|today's|khabrein|samachar)\b/gi, '')
        .trim();

      return {
        intent: 'NEWS_SEARCH',
        tools: [{ name: 'newsSearch', params: { query: topic || 'AI technology', limit: 4 } }],
      };
    }

    // 11. Web search ("search the web for...", "google...", "look up...", "search for...")
    const isWebSearch =
      /\b(?:search the web|search web|search for|look up|find information on|who is|what is|tell me about|khojo|dhundho)\b/i.test(q) ||
      /(?:खोजो|ढूंढो)/.test(q);

    if (isWebSearch) {
      const topic = query
        .replace(/^(?:hey\s+)?jarvis,?\s*/i, '')
        .replace(/^(?:search the web for|search web for|search for|look up|find information on|khojo|dhundho)\s+/i, '')
        .replace(/(?:खोजो|ढूंढो)\s*/g, '')
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
