import { describe, it, expect } from 'vitest';
import { toolRegistry } from '../tools/registry.js';
import { eventRepo } from '../db/index.js';

describe('Additional Tool Unit Tests', () => {
  it('handles division and zero division safely', async () => {
    const calc = toolRegistry.get('calculator')!;
    const res1 = await calc.execute({ expression: '100 / 4' }, { db: null, demoMode: true });
    expect(res1.result).toBe(25);

    const res2 = await calc.execute({ expression: '10 / 0' }, { db: null, demoMode: true });
    expect(res2.result).toBe('Calculation Error');
  });

  it('retrieves system status metrics accurately', async () => {
    const sys = toolRegistry.get('systemStatus')!;
    const res = await sys.execute(undefined, { db: null, demoMode: true });
    expect(res.status).toBe('OPTIMAL');
    expect(res.memory.heapUsedMB).toBeGreaterThan(0);
    expect(res.database.status).toContain('CONNECTED');
  });

  it('resolves time and world clocks', async () => {
    const timeTool = toolRegistry.get('time')!;
    const res = await timeTool.execute({ location: 'Tokyo' }, { db: null, demoMode: true });
    expect(res.timezone).toBe('Asia/Tokyo');
    expect(res.worldClocks.length).toBeGreaterThanOrEqual(4);
  });

  it('weather tool returns structured 5-day forecast', async () => {
    const weather = toolRegistry.get('weather')!;
    const res = await weather.execute({ location: 'London' }, { db: null, demoMode: true });
    expect(res.forecast.length).toBe(5);
    expect(res.unit).toBe('°C');
  });

  it('event repository logs and retrieves chronological events', () => {
    const evt = eventRepo.create('TEST_EVENT', 'System diagnostic test pass', 'info');
    expect(evt.id).toBeDefined();
    expect(evt.type).toBe('TEST_EVENT');

    const list = eventRepo.list(50);
    expect(list.some((e) => e.type === 'TEST_EVENT')).toBe(true);
  });
});
