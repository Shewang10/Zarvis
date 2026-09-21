import { describe, it, expect } from 'vitest';
import app from '../index.js';
import { EventEmitter } from 'node:events';

// Lightweight in-memory HTTP test helper (zero network sockets required)
function testRequest(
  method: string,
  url: string,
  body?: any
): Promise<{ status: number; body: any; headers: Record<string, any> }> {
  return new Promise((resolve) => {
    const req: any = new EventEmitter();
    req.method = method;
    req.url = url;
    req.path = url.split('?')[0];
    req.headers = { 'content-type': 'application/json' };
    req.body = body;

    const res: any = new EventEmitter();
    res.statusCode = 200;
    res.headers = {};
    let responseBody = '';

    res.setHeader = (key: string, val: any) => {
      res.headers[key.toLowerCase()] = val;
    };
    res.getHeader = (key: string) => res.headers[key.toLowerCase()];
    res.status = (code: number) => {
      res.statusCode = code;
      return res;
    };
    res.json = (data: any) => {
      res.emit('finish');
      resolve({
        status: res.statusCode,
        body: data,
        headers: res.headers,
      });
    };
    res.send = (data: any) => {
      responseBody = data;
      res.emit('finish');
      resolve({
        status: res.statusCode,
        body: responseBody,
        headers: res.headers,
      });
    };

    (app as any).handle(req, res);
  });
}

describe('JARVIS In-Memory API Endpoints', () => {
  it('GET /api/status returns ONLINE status and active tool list', async () => {
    const res = await testRequest('GET', '/api/status');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ONLINE');
    expect(res.body.system).toBe('JARVIS AI COMMAND CENTER');
    expect(Array.isArray(res.body.tools)).toBe(true);
    expect(res.body.tools).toContain('newsSearch');
    expect(res.body.tools).toContain('calculator');
    expect(res.body.tools).toContain('weather');
  });

  it('POST /api/command orchestrates calculator and returns dynamic component', async () => {
    const res = await testRequest('POST', '/api/command', {
      text: 'Hey Jarvis, calculate 125 multiplied by 47',
      demoMode: true,
    });

    expect(res.status).toBe(200);
    expect(res.body.intent).toBe('CALCULATOR');
    expect(res.body.component.type).toBe('CALCULATION');
    expect(res.body.spokenResponse).toContain('5,875');
    expect(res.body.toolsExecuted[0].tool).toBe('calculator');
  });

  it('POST /api/memory and GET /api/memory stores and lists records', async () => {
    // 1. Store
    const postRes = await testRequest('POST', '/api/memory', {
      key: 'ProjectCleanFleet',
      content: 'CleanFleet is our high-performance fleet optimization initiative.',
      category: 'projects',
      tags: ['fleet', 'clean'],
    });

    expect(postRes.status).toBe(201);
    expect(postRes.body.key).toBe('ProjectCleanFleet');

    // 2. Retrieve
    const getRes = await testRequest('GET', '/api/memory');
    expect(getRes.status).toBe(200);
    expect(getRes.body.memories.some((m: any) => m.key === 'ProjectCleanFleet')).toBe(true);
  });

  it('GET /api/events returns event stream', async () => {
    const res = await testRequest('GET', '/api/events');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.events)).toBe(true);
  });
});

