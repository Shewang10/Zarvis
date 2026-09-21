import crypto from 'node:crypto';
import {
  CommandRequest,
  CommandResponse,
  DynamicUIComponent,
  ComponentType,
  JarvisEvent,
} from './types.js';
import { toolRegistry } from './tools/registry.js';
import { getAIProvider } from './ai/provider.js';
import {
  conversationRepo,
  eventRepo,
  toolExecutionRepo,
  getDatabase,
} from './db/index.js';

export async function processCommand(request: CommandRequest): Promise<CommandResponse> {
  const startTime = Date.now();
  const conversationId = request.conversationId || crypto.randomUUID();
  const rawText = (request.text || '').trim();
  const isDemo = Boolean(request.demoMode || process.env.DEMO_MODE === 'true');

  const events: JarvisEvent[] = [];

  const logEvent = (type: string, details: string, status: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const evt = eventRepo.create(type, details, status, conversationId);
    events.push(evt);
  };

  // 1. Voice / Command Input
  logEvent('VOICE_INPUT', `Received audio/text directive: "${rawText}"`, 'info');

  // 2. Intent Detection
  const routing = toolRegistry.routeIntent(rawText);
  logEvent('INTENT_DETECTION', `Intent classified as: ${routing.intent}`, 'info');

  // 3. Tool Selection & Execution
  const toolResults: Array<{
    tool: string;
    durationMs: number;
    status: 'success' | 'error';
    summary?: string;
    data: any;
  }> = [];

  for (const t of routing.tools) {
    const toolStart = Date.now();
    logEvent('TOOL_EXECUTION_START', `Engaging subsystem: ${t.name}`, 'info');

    try {
      const data = await toolRegistry.execute(t.name, t.params, {
        db: getDatabase(),
        demoMode: isDemo,
      });
      const durationMs = Date.now() - toolStart;

      toolExecutionRepo.record(t.name, t.params, data, durationMs, 'success');
      logEvent('TOOL_EXECUTION_SUCCESS', `Subsystem ${t.name} completed in ${durationMs}ms`, 'success');

      toolResults.push({
        tool: t.name,
        durationMs,
        status: 'success',
        data,
      });
    } catch (err: any) {
      const durationMs = Date.now() - toolStart;
      toolExecutionRepo.record(t.name, t.params, { error: err.message }, durationMs, 'error');
      logEvent('TOOL_EXECUTION_ERROR', `Subsystem ${t.name} failed: ${err.message}`, 'error');

      toolResults.push({
        tool: t.name,
        durationMs,
        status: 'error',
        summary: err.message,
        data: null,
      });
    }
  }

  // 4. Data Processing & Dynamic Component Generation
  logEvent('DATA_PROCESSING', 'Synthesizing dynamic telemetry payload', 'info');
  const primaryResult = toolResults[0]?.data;
  const component = buildDynamicComponent(routing.intent, routing.tools[0]?.name, primaryResult, rawText);
  logEvent('UI_RENDERING', `Instantiated holographic component: <${component.type} />`, 'success');

  // 5. Response Synthesis via AI Provider
  const ai = getAIProvider();
  logEvent('AI_SYNTHESIS', `Synthesizing persona response via ${ai.name}`, 'info');
  const summary = await ai.summarizeToolResults(
    routing.intent,
    routing.tools[0]?.name || 'system',
    primaryResult,
    rawText
  );

  logEvent('VOICE_RESPONSE', 'Audio payload synthesized for speech stream', 'success');

  // 6. Record conversation in database
  conversationRepo.create(rawText, summary.text, routing.intent, component.type);

  return {
    conversationId,
    query: rawText,
    intent: routing.intent,
    toolsExecuted: toolResults.map((r) => ({
      tool: r.tool,
      durationMs: r.durationMs,
      status: r.status,
      summary: r.summary,
    })),
    component,
    spokenResponse: summary.spoken,
    textResponse: summary.text,
    events,
    timestamp: new Date().toISOString(),
  };
}

function buildDynamicComponent(
  intent: string,
  toolName: string,
  data: any,
  query: string
): DynamicUIComponent {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  switch (intent) {
    case 'EMAIL':
      return {
        id,
        type: 'EMAIL',
        title: 'COMMUNICATIONS & OUTLOOK CONSOLE',
        subtitle: `Action: ${data?.actionExecuted || 'Inbox'} • ${data?.inbox?.length || 0} communications`,
        data: data || {},
        createdAt: now,
      };

    case 'BROWSER_CONTROL':
      return {
        id,
        type: 'SEARCH_RESULTS',
        title: 'BROWSER & APP NAVIGATION',
        subtitle: `Target: ${data?.app || data?.url || 'Web'}`,
        data: {
          query: data?.url || query,
          totalResults: 1,
          results: [
            {
              title: `Launch ${data?.app || 'Web Destination'}`,
              url: data?.url || 'https://www.google.com',
              snippet: data?.message || `Navigating to ${data?.url || data?.app}`,
              domain: data?.app || 'system',
            },
          ],
        },
        createdAt: now,
      };

    case 'NEWS_SEARCH':
      return {
        id,
        type: 'NEWS',
        title: 'HOLOGRAPHIC NEWS FEED',
        subtitle: `Query: "${data?.query || query}" • ${data?.totalResults || 0} feeds active`,
        data: data || { articles: [] },
        createdAt: now,
      };

    case 'WEB_SEARCH':
      return {
        id,
        type: 'SEARCH_RESULTS',
        title: 'TACTICAL INTELLIGENCE SEARCH',
        subtitle: `Indexed results for "${data?.query || query}"`,
        data: data || { results: [] },
        createdAt: now,
      };

    case 'CALCULATOR':
      return {
        id,
        type: 'CALCULATION',
        title: 'QUANTUM ARITHMETIC UNIT',
        subtitle: `Expression: ${data?.expression || query}`,
        data: data || {},
        createdAt: now,
      };

    case 'WEATHER':
      return {
        id,
        type: 'WEATHER',
        title: 'ATMOSPHERIC SENSOR SUITE',
        subtitle: `Telemetry: ${data?.location || 'Command HQ'}`,
        data: data || {},
        createdAt: now,
      };

    case 'MEMORY_STORE':
    case 'MEMORY_RECALL':
      return {
        id,
        type: 'MEMORY',
        title: 'SYNAPTIC MEMORY ARCHIVE',
        subtitle: intent === 'MEMORY_STORE' ? 'Record committed' : `Query: "${query}"`,
        data: data || {},
        createdAt: now,
      };

    case 'TIME':
      return {
        id,
        type: 'TIME',
        title: 'CHRONOMETER & CHRONO-RADAR',
        subtitle: `Local & Global Timelines`,
        data: data || {},
        createdAt: now,
      };

    case 'SYSTEM_STATUS':
      return {
        id,
        type: 'SYSTEM_STATUS',
        title: 'CORE TELEMETRY & DIAGNOSTICS',
        subtitle: 'Subsystem Status: OPTIMAL',
        data: data || {},
        createdAt: now,
      };

    case 'DATABASE_QUERY':
      return {
        id,
        type: 'SUMMARY',
        title: 'COMMAND EVENT ARCHIVE',
        subtitle: 'Interaction Log',
        data: data || {},
        createdAt: now,
      };

    default:
      return {
        id,
        type: 'SUMMARY',
        title: 'INTELLIGENCE BRIEFING',
        subtitle: `Query: ${query}`,
        data: { text: data },
        createdAt: now,
      };
  }
}

