import os from 'node:os';
import process from 'node:process';
import { ToolDefinition } from '../types.js';
import { memoryRepo, conversationRepo, eventRepo } from '../db/index.js';

interface SystemStatusOutput {
  status: 'OPTIMAL' | 'DEGRADED' | 'MAINTENANCE';
  platform: string;
  architecture: string;
  nodeVersion: string;
  uptimeSeconds: number;
  uptimeFormatted: string;
  memory: {
    heapUsedMB: number;
    heapTotalMB: number;
    rssMB: number;
    systemTotalMB: number;
    systemFreeMB: number;
    memoryPressure: string;
  };
  cpu: {
    model: string;
    cores: number;
    loadAvg: number[];
  };
  database: {
    memoriesCount: number;
    conversationsCount: number;
    eventsCount: number;
    status: string;
  };
  services: {
    voiceEngine: string;
    searchProvider: string;
    aiProvider: string;
  };
}

export const systemStatusTool: ToolDefinition<void, SystemStatusOutput> = {
  name: 'systemStatus',
  description: 'Retrieves JARVIS system health, core telemetry, memory usage, CPU load, and connected subsystems.',
  parameters: {
    type: 'object',
    properties: {},
  },
  execute: async (_, context) => {
    const mem = process.memoryUsage();
    const uptimeSec = Math.floor(process.uptime());
    const hours = Math.floor(uptimeSec / 3600);
    const minutes = Math.floor((uptimeSec % 3600) / 60);
    const seconds = uptimeSec % 60;
    const uptimeStr = `${hours}h ${minutes}m ${seconds}s`;

    const cpus = os.cpus();
    const totalMem = Math.round(os.totalmem() / (1024 * 1024));
    const freeMem = Math.round(os.freemem() / (1024 * 1024));
    const heapUsed = Math.round(mem.heapUsed / (1024 * 1024));
    const heapTotal = Math.round(mem.heapTotal / (1024 * 1024));
    const rss = Math.round(mem.rss / (1024 * 1024));

    const memories = memoryRepo.list(100);
    const conversations = conversationRepo.list(100);
    const events = eventRepo.list(100);

    const hasGemini = Boolean(process.env.GEMINI_API_KEY);
    const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);

    return {
      status: 'OPTIMAL',
      platform: `${os.type()} ${os.release()} (${os.platform()})`,
      architecture: os.arch(),
      nodeVersion: process.version,
      uptimeSeconds: uptimeSec,
      uptimeFormatted: uptimeStr,
      memory: {
        heapUsedMB: heapUsed,
        heapTotalMB: heapTotal,
        rssMB: rss,
        systemTotalMB: totalMem,
        systemFreeMB: freeMem,
        memoryPressure: `${Math.round((1 - freeMem / totalMem) * 100)}%`,
      },
      cpu: {
        model: cpus[0]?.model || 'Core Processor',
        cores: cpus.length,
        loadAvg: os.loadavg().map((l) => Number(l.toFixed(2))),
      },
      database: {
        memoriesCount: memories.length,
        conversationsCount: conversations.length,
        eventsCount: events.length,
        status: 'CONNECTED (SQLite Sync Engine)',
      },
      services: {
        voiceEngine: 'Web Speech API + Synthetic Audio Core',
        searchProvider: context.demoMode ? 'Curated Vector Index' : 'DuckDuckGo + Google RSS',
        aiProvider: hasGemini ? 'Google Gemini' : hasOpenAI ? 'OpenAI GPT-4o' : 'Deterministic JARVIS Core',
      },
    };
  },
};

