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

export const api = {
  async sendCommand(
    text: string,
    conversationId?: string,
    demoMode?: boolean
  ): Promise<CommandApiResponse> {
    const res = await fetch(`${API_BASE}/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, conversationId, demoMode }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error || err.details || `Command execution failed with status ${res.status}`);
    }

    return res.json();
  },

  async getStatus(): Promise<SystemStatusData> {
    const res = await fetch(`${API_BASE}/status`);
    if (!res.ok) throw new Error(`Status check failed with status ${res.status}`);
    return res.json();
  },

  async getEvents(limit = 40): Promise<JarvisEvent[]> {
    const res = await fetch(`${API_BASE}/events?limit=${limit}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.events || [];
  },

  async getMemories(query?: string): Promise<any[]> {
    const url = query ? `${API_BASE}/memory?q=${encodeURIComponent(query)}` : `${API_BASE}/memory`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.memories || [];
  },

  async deleteMemory(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/memory/${id}`, { method: 'DELETE' });
    return res.ok;
  },

  async getConversations(limit = 20): Promise<any[]> {
    const res = await fetch(`${API_BASE}/conversations?limit=${limit}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.conversations || [];
  },
};

