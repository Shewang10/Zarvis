import { describe, it, expect } from 'vitest';
import { toolRegistry } from '../tools/registry.js';
import { processCommand } from '../orchestrator.js';
import { memoryRepo } from '../db/index.js';

describe('JARVIS Intent Routing', () => {
  it('correctly routes calculator commands', () => {
    const r1 = toolRegistry.routeIntent('Hey Jarvis, calculate 125 multiplied by 47');
    expect(r1.intent).toBe('CALCULATOR');
    expect(r1.tools[0].name).toBe('calculator');

    const r2 = toolRegistry.routeIntent('Jarvis, what is 20 percent of 850?');
    expect(r2.intent).toBe('CALCULATOR');
  });

  it('correctly routes news queries', () => {
    const r = toolRegistry.routeIntent('Hey Jarvis, what are the latest AI news today?');
    expect(r.intent).toBe('NEWS_SEARCH');
    expect(r.tools[0].name).toBe('newsSearch');
  });

  it('correctly routes web search queries', () => {
    const r = toolRegistry.routeIntent('Jarvis, search the web for the latest NVIDIA AI announcements.');
    expect(r.intent).toBe('WEB_SEARCH');
    expect(r.tools[0].name).toBe('webSearch');
  });

  it('correctly routes memory storage commands', () => {
    const r = toolRegistry.routeIntent('Jarvis, remember that my project is called CleanFleet.');
    expect(r.intent).toBe('MEMORY_STORE');
    expect(r.tools[0].name).toBe('memoryStore');
  });

  it('correctly routes memory recall queries', () => {
    const r = toolRegistry.routeIntent('Jarvis, what do you remember about CleanFleet?');
    expect(r.intent).toBe('MEMORY_RECALL');
    expect(r.tools[0].name).toBe('memoryRecall');
  });

  it('correctly routes weather queries', () => {
    const r = toolRegistry.routeIntent('Jarvis, show me today\'s weather.');
    expect(r.intent).toBe('WEATHER');
    expect(r.tools[0].name).toBe('weather');
  });

  it('correctly routes time queries', () => {
    const r = toolRegistry.routeIntent('Jarvis, what time is it?');
    expect(r.intent).toBe('TIME');
    expect(r.tools[0].name).toBe('time');
  });

  it('correctly routes conversation history query', () => {
    const r = toolRegistry.routeIntent('Jarvis, show me the last five things I asked you.');
    expect(r.intent).toBe('DATABASE_QUERY');
    expect(r.tools[0].name).toBe('databaseQuery');
  });

  it('correctly routes email and outlook commands in English and Hindi', () => {
    const r1 = toolRegistry.routeIntent('Jarvis, open my email');
    expect(r1.intent).toBe('EMAIL');
    expect(r1.tools[0].name).toBe('email');

    const r2 = toolRegistry.routeIntent('जार्विस मेरा ईमेल खोलो');
    expect(r2.intent).toBe('EMAIL');
    expect(r2.tools[0].name).toBe('email');
  });

  it('correctly routes browser control commands', () => {
    const r = toolRegistry.routeIntent('Jarvis, open youtube');
    expect(r.intent).toBe('BROWSER_CONTROL');
    expect(r.tools[0].name).toBe('browserControl');
    expect(r.tools[0].params.url).toContain('youtube.com');
  });

  it('correctly routes Hindi weather queries', () => {
    const r = toolRegistry.routeIntent('जार्विस आज का मौसम बताओ');
    expect(r.intent).toBe('WEATHER');
    expect(r.tools[0].name).toBe('weather');
  });
});

describe('JARVIS Tool Execution & Math', () => {
  it('evaluates 125 multiplied by 47 correctly', async () => {
    const calc = toolRegistry.get('calculator')!;
    const res = await calc.execute({ expression: '125 multiplied by 47' }, { db: null, demoMode: true });
    expect(res.result).toBe(5875);
    expect(res.formattedResult).toBe('5,875');
  });

  it('evaluates percentages correctly', async () => {
    const calc = toolRegistry.get('calculator')!;
    const res = await calc.execute({ expression: '20 percent of 850' }, { db: null, demoMode: true });
    expect(res.result).toBe(170);
  });
});

describe('JARVIS Full Orchestrator Pipeline', () => {
  it('processes a full calculation cycle and returns dynamic component', async () => {
    const response = await processCommand({
      text: 'Jarvis, calculate 125 multiplied by 47',
      demoMode: true,
    });

    expect(response.intent).toBe('CALCULATOR');
    expect(response.component.type).toBe('CALCULATION');
    expect(response.spokenResponse).toContain('5,875');
    expect(response.events.length).toBeGreaterThan(3);
  });

  it('stores and recalls persistent memory', async () => {
    // 1. Store memory
    const storeRes = await processCommand({
      text: 'Jarvis, remember that my project is called CleanFleet',
      demoMode: true,
    });
    expect(storeRes.intent).toBe('MEMORY_STORE');
    expect(storeRes.component.type).toBe('MEMORY');

    // 2. Recall memory
    const recallRes = await processCommand({
      text: 'Jarvis, what do you remember about CleanFleet?',
      demoMode: true,
    });
    expect(recallRes.intent).toBe('MEMORY_RECALL');
    expect(recallRes.spokenResponse.toLowerCase()).toContain('cleanfleet');
    expect(recallRes.component.type).toBe('MEMORY');
  });

  it('processes AI news search and returns rich article cards', async () => {
    const newsRes = await processCommand({
      text: 'Hey Jarvis, what are the latest AI news today?',
      demoMode: true,
    });
    expect(newsRes.intent).toBe('NEWS_SEARCH');
    expect(newsRes.component.type).toBe('NEWS');
    expect(newsRes.component.data.articles.length).toBeGreaterThan(0);
    expect(newsRes.component.data.articles[0].title).toBeDefined();
    expect(newsRes.component.data.articles[0].source).toBeDefined();
    expect(newsRes.component.data.articles[0].url).toBeDefined();
  });

  it('processes email command and returns EMAIL component with inbox stream', async () => {
    const emailRes = await processCommand({
      text: 'Jarvis, open my email',
      demoMode: true,
    });
    expect(emailRes.intent).toBe('EMAIL');
    expect(emailRes.component.type).toBe('EMAIL');
    expect(emailRes.component.data.inbox).toBeDefined();
    expect(emailRes.component.data.inbox.length).toBeGreaterThan(0);
    expect(emailRes.spokenResponse).toContain('Microsoft Outlook');
  });

  it('handles Hindi directives and provides responses in Hindi', async () => {
    const hindiRes = await processCommand({
      text: 'जार्विस आज का मौसम बताओ',
      demoMode: true,
    });
    expect(hindiRes.intent).toBe('WEATHER');
    expect(hindiRes.component.type).toBe('WEATHER');
    // Spoken response should be in Hindi
    expect(hindiRes.spokenResponse).toMatch(/[\u0900-\u097F]/);
    expect(hindiRes.spokenResponse).toContain('मौसम');
  });
});

