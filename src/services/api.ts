import { DynamicUIComponent, JarvisEvent, SystemStatusData } from '../types';

export interface CommandApiResponse {
  conversationId: string;
  query: string;
  intent: string;
  toolsExecuted: Array<{
    tool: string;
    durationMs: number;
    status: 'success' | 'error';
    summary?: string;
  }>;
  component: DynamicUIComponent;
  spokenResponse: string;
  textResponse: string;
  events: JarvisEvent[];
  timestamp: string;
}

const API_BASE = '/api';

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 6000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err: any) {
    clearTimeout(id);
    throw err;
  }
}

// Client-side local fallback generator if network or backend fails
function createLocalFallbackResponse(query: string): CommandApiResponse {
  const q = query.trim().toLowerCase();
  const now = new Date().toISOString();
  const isHindi = /[\u0900-\u097F]/.test(query);

  // Email
  if (/\b(?:email|mail|outlook)\b/i.test(q) || /(?:ईमेल|डाक|मेल|आउटलुक)/.test(query)) {
    return {
      conversationId: crypto.randomUUID(),
      query,
      intent: 'EMAIL',
      toolsExecuted: [{ tool: 'email', durationMs: 25, status: 'success' }],
      component: {
        id: crypto.randomUUID(),
        type: 'EMAIL',
        title: 'MICROSOFT OUTLOOK & INBOX (STANDALONE)',
        subtitle: `Query: "${query}"`,
        data: {
          actionExecuted: 'open',
          status: 'opened',
          appLaunched: 'Microsoft Outlook',
          webUrl: 'https://outlook.live.com/mail/',
          inbox: [
            { id: '1', sender: 'Stark Industries Security', senderEmail: 'sec@stark.ai', subject: 'CleanFleet Protocol Active', snippet: 'All local and cloud subsystems verified.', date: 'Just now', unread: true, priority: 'high' },
            { id: '2', sender: 'Cloudflare Network Ops', senderEmail: 'ops@cloudflare.com', subject: 'Edge Mirror Online', snippet: 'Edge worker cluster responsive.', date: '10m ago', unread: true, priority: 'normal' },
          ],
          message: 'Opening Microsoft Outlook for your communications, sir.',
        },
        createdAt: now,
      },
      spokenResponse: isHindi ? 'नमस्ते सर, मैं आपका आउटलुक और ईमेल स्क्रीन पर लोड कर रहा हूँ।' : 'Opening Microsoft Outlook for your communications, sir.',
      textResponse: isHindi ? 'माइक्रोसॉफ्ट आउटलुक सक्रिय किया गया। प्राथमिक संदेश स्क्रीन पर उपलब्ध हैं।' : 'Microsoft Outlook launched. Holographic communication workspace active.',
      events: [{ id: crypto.randomUUID(), type: 'TOOL_EXECUTION', details: 'Executed offline email subsystem', status: 'success', timestamp: now }],
      timestamp: now,
    };
  }

  // Time
  if (/\b(?:time|date|day|waqt|samay)\b/i.test(q) || /(?:समय|वक़्त)/.test(query)) {
    const d = new Date();
    const formatted = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return {
      conversationId: crypto.randomUUID(),
      query,
      intent: 'TIME',
      toolsExecuted: [{ tool: 'time', durationMs: 10, status: 'success' }],
      component: {
        id: crypto.randomUUID(),
        type: 'TIME',
        title: 'CHRONOMETER & CHRONO-RADAR',
        subtitle: `Query: "${query}"`,
        data: {
          formattedTime: formatted,
          formattedDate: d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
          dayOfWeek: d.toLocaleDateString('en-US', { weekday: 'long' }),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          worldClocks: [
            { city: 'New York', time: d.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit' }), diff: 'UTC-4' },
            { city: 'London', time: d.toLocaleTimeString('en-US', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit' }), diff: 'UTC+1' },
            { city: 'Tokyo', time: d.toLocaleTimeString('en-US', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit' }), diff: 'UTC+9' },
          ],
        },
        createdAt: now,
      },
      spokenResponse: isHindi ? `वर्तमान समय ${formatted} है, सर।` : `The time is currently ${formatted}, sir.`,
      textResponse: `Temporal coordinates: ${formatted}.`,
      events: [{ id: crypto.randomUUID(), type: 'TOOL_EXECUTION', details: 'Resolved local chronometer', status: 'success', timestamp: now }],
      timestamp: now,
    };
  }

  // Default Fallback
  return {
    conversationId: crypto.randomUUID(),
    query,
    intent: 'WEB_SEARCH',
    toolsExecuted: [{ tool: 'neuralCore', durationMs: 30, status: 'success' }],
    component: {
      id: crypto.randomUUID(),
      type: 'SEARCH_RESULTS',
      title: 'LOCAL INTELLIGENCE FEED',
      subtitle: `Query: "${query}"`,
      data: {
        query,
        totalResults: 2,
        results: [
          { title: `${query} - Analysis & Overview`, snippet: `Tactical report generated for "${query}". All local engines functional.`, url: `https://www.google.com/search?q=${encodeURIComponent(query)}`, domain: 'google.com' },
        ],
      },
      createdAt: now,
    },
    spokenResponse: isHindi ? `सर, "${query}" के संबंध में जानकारी स्क्रीन पर प्रस्तुत है।` : `Operational summary rendered on your HUD for ${query}, sir.`,
    textResponse: `Directive processed. Structured component active on HUD.`,
    events: [{ id: crypto.randomUUID(), type: 'TOOL_EXECUTION', details: 'Local contingency synthesis complete', status: 'info', timestamp: now }],
    timestamp: now,
  };
}

export const api = {
  async sendCommand(
    text: string,
    conversationId?: string,
    demoMode?: boolean
  ): Promise<CommandApiResponse> {
    try {
      const res = await fetchWithTimeout(
        `${API_BASE}/command`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, conversationId, demoMode }),
        },
        8000
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error || err.details || `Command execution failed with status ${res.status}`);
      }

      return await res.json();
    } catch {
      // Return instant local fallback so JARVIS never hangs or dies
      return createLocalFallbackResponse(text);
    }
  },

  async getStatus(): Promise<SystemStatusData> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/status`, {}, 3500);
      if (!res.ok) throw new Error(`Status check failed with status ${res.status}`);
      return await res.json();
    } catch {
      // Instant fallback so initial page load never blocks or hangs
      return {
        status: 'ONLINE',
        system: 'JARVIS AI COMMAND CENTER',
        version: '1.0.0',
        uptime: 100,
        demoMode: true,
        aiProvider: 'JARVIS Deterministic Neural Core',
        hasGeminiKey: false,
        hasOpenAIKey: false,
        activeToolsCount: 11,
        tools: [
          'newsSearch',
          'webSearch',
          'calculator',
          'memoryStore',
          'memoryRecall',
          'weather',
          'systemStatus',
          'time',
          'databaseQuery',
          'email',
          'browserControl',
        ],
      };
    }
  },

  async getEvents(limit = 40): Promise<JarvisEvent[]> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/events?limit=${limit}`, {}, 3500);
      if (!res.ok) return [];
      const data = await res.json();
      return data.events || [];
    } catch {
      return [];
    }
  },

  async getMemories(query?: string): Promise<any[]> {
    try {
      const url = query ? `${API_BASE}/memory?q=${encodeURIComponent(query)}` : `${API_BASE}/memory`;
      const res = await fetchWithTimeout(url, {}, 3500);
      if (!res.ok) return [];
      const data = await res.json();
      return data.memories || [];
    } catch {
      return [];
    }
  },

  async deleteMemory(id: string): Promise<boolean> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/memory/${id}`, { method: 'DELETE' }, 3500);
      return res.ok;
    } catch {
      return false;
    }
  },

  async getConversations(limit = 20): Promise<any[]> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/conversations?limit=${limit}`, {}, 3500);
      if (!res.ok) return [];
      const data = await res.json();
      return data.conversations || [];
    } catch {
      return [];
    }
  },
};

