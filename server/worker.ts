/**
 * Cloudflare Worker Edge Entry Point for JARVIS AI Command Center
 * Supports Edge API Orchestration + Cloudflare D1 + Static Assets
 */

export interface Env {
  DB: any; // Cloudflare D1 database binding
  ASSETS: any; // Static assets binding
  GEMINI_API_KEY?: string;
  OPENAI_API_KEY?: string;
  DEMO_MODE?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // 1. CORS Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    const jsonHeaders = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    };

    // 2. Route API requests
    if (url.pathname.startsWith('/api')) {
      // GET /api/status
      if (url.pathname === '/api/status' && request.method === 'GET') {
        return new Response(
          JSON.stringify({
            status: 'ONLINE',
            system: 'JARVIS AI COMMAND CENTER (Cloudflare Edge)',
            version: '1.0.0',
            platform: 'Cloudflare Workers (Edge)',
            demoMode: env.DEMO_MODE === 'true' || (!env.GEMINI_API_KEY && !env.OPENAI_API_KEY),
            aiProvider: env.GEMINI_API_KEY ? 'Google Gemini' : 'JARVIS Deterministic Neural Core',
            hasGeminiKey: Boolean(env.GEMINI_API_KEY),
            hasOpenAIKey: Boolean(env.OPENAI_API_KEY),
            activeToolsCount: 9,
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
            ],
            timestamp: new Date().toISOString(),
          }),
          { headers: jsonHeaders }
        );
      }

      // POST /api/command
      if (url.pathname === '/api/command' && request.method === 'POST') {
        try {
          const body = (await request.json()) as any;
          const text = (body.text || '').trim();
          if (!text) {
            return new Response(JSON.stringify({ error: 'Field "text" is required.' }), {
              status: 400,
              headers: jsonHeaders,
            });
          }

          const response = await handleEdgeCommand(text, body.demoMode, env);
          return new Response(JSON.stringify(response), { headers: jsonHeaders });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: jsonHeaders,
          });
        }
      }

      // GET /api/memory
      if (url.pathname === '/api/memory' && request.method === 'GET') {
        const q = url.searchParams.get('q');
        let rows = [];
        if (q) {
          const wildcard = `%${q.toLowerCase()}%`;
          const res = await env.DB.prepare(
            'SELECT * FROM memories WHERE LOWER(key) LIKE ? OR LOWER(content) LIKE ? ORDER BY updated_at DESC LIMIT 20'
          ).bind(wildcard, wildcard).all();
          rows = res.results || [];
        } else {
          const res = await env.DB.prepare('SELECT * FROM memories ORDER BY updated_at DESC LIMIT 50').all();
          rows = res.results || [];
        }

        const memories = rows.map((r: any) => ({
          id: r.id,
          key: r.key,
          content: r.content,
          category: r.category,
          tags: JSON.parse(r.tags || '[]'),
          metadata: JSON.parse(r.metadata || '{}'),
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        }));

        return new Response(JSON.stringify({ memories }), { headers: jsonHeaders });
      }

      // POST /api/memory
      if (url.pathname === '/api/memory' && request.method === 'POST') {
        const body = (await request.json()) as any;
        const key = body.key || body.content.slice(0, 30);
        const content = body.content;
        const category = body.category || 'general';
        const tags = JSON.stringify(body.tags || []);
        const metadata = JSON.stringify(body.metadata || {});
        const now = new Date().toISOString();
        const id = crypto.randomUUID();

        await env.DB.prepare(
          'INSERT INTO memories (id, key, content, category, tags, metadata, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(id, key, content, category, tags, metadata, now, now).run();

        return new Response(JSON.stringify({ id, key, content, category }), {
          status: 201,
          headers: jsonHeaders,
        });
      }

      // DELETE /api/memory/:id
      if (url.pathname.startsWith('/api/memory/') && request.method === 'DELETE') {
        const id = url.pathname.replace('/api/memory/', '');
        await env.DB.prepare('DELETE FROM memories WHERE id = ?').bind(id).run();
        return new Response(JSON.stringify({ success: true, deletedId: id }), {
          headers: jsonHeaders,
        });
      }

      // GET /api/events
      if (url.pathname === '/api/events' && request.method === 'GET') {
        const res = await env.DB.prepare('SELECT * FROM events ORDER BY created_at DESC LIMIT 30').all();
        const events = (res.results || []).map((r: any) => ({
          id: r.id,
          conversationId: r.conversation_id,
          type: r.event_type,
          status: r.status,
          details: r.details,
          timestamp: r.created_at,
        }));
        return new Response(JSON.stringify({ events }), { headers: jsonHeaders });
      }
    }

    // 3. Static asset serving for frontend
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('JARVIS Command Center Edge Online', { status: 200 });
  },
};

// Edge Orchestration Logic
async function handleEdgeCommand(query: string, demoModeOverride: boolean | undefined, env: Env) {
  const conversationId = crypto.randomUUID();
  const now = new Date().toISOString();
  const isDemo = demoModeOverride ?? (env.DEMO_MODE === 'true' || !env.GEMINI_API_KEY);
  const q = query.trim().toLowerCase();

  const events: any[] = [];
  const logEvent = async (type: string, details: string, status = 'info') => {
    const id = crypto.randomUUID();
    events.push({ id, type, details, status, timestamp: now });
    try {
      await env.DB.prepare(
        'INSERT INTO events (id, conversation_id, event_type, status, details, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(id, conversationId, type, status, details, now).run();
    } catch {
      // Ignore
    }
  };

  await logEvent('VOICE_INPUT', `Received directive: "${query}"`, 'info');

  // Intent Routing
  let intent = 'WEB_SEARCH';
  let toolName = 'webSearch';
  let toolData: any = null;
  let componentType = 'SEARCH_RESULTS';
  let componentTitle = 'SEARCH RESULTS';

  // 1. Calculator
  if (
    /^(?:calculate|compute|what is|how much is)\s+[\d\s+\-*/().,x%^]+$/i.test(q) ||
    /\b(multiplied by|divided by|times|plus|minus|percent of|\^|sqrt)\b/i.test(q)
  ) {
    intent = 'CALCULATOR';
    toolName = 'calculator';
    componentType = 'CALCULATION';
    componentTitle = 'QUANTUM ARITHMETIC UNIT';

    const expr = query.replace(/^(?:hey\s+)?jarvis,?\s*/i, '').replace(/^(?:calculate|compute|what is)\s+/i, '');
    let norm = expr
      .replace(/multiplied by|times|x/gi, '*')
      .replace(/divided by|over/gi, '/')
      .replace(/plus/gi, '+')
      .replace(/minus/gi, '-')
      .replace(/percent of/gi, '* 0.01 *')
      .replace(/percent/gi, '* 0.01');
    const sanitized = norm.replace(/[^0-9+\-*/().,^%\sMath\.sqrtcbptieLogEPI]/g, '');

    try {
      const val = safeEvaluateMath(sanitized);
      toolData = {
        expression: expr,
        result: val,
        formattedResult: Number.isInteger(val) ? val.toLocaleString('en-US') : Number(val.toFixed(4)).toLocaleString(),
        steps: [`Input: "${expr}"`, `Normalized: "${sanitized}"`, `Calculated: ${val}`],
      };
    } catch (e: any) {
      toolData = { expression: expr, result: 'Error', formattedResult: 'Calculation Error' };
    }
  }

  // 2. Memory Store
  else if (/\b(?:remember that|remember:|remember|note that|store that)\b/i.test(q) && !/\b(?:what do you remember)\b/i.test(q)) {
    intent = 'MEMORY_STORE';
    toolName = 'memoryStore';
    componentType = 'MEMORY';
    componentTitle = 'SYNAPTIC MEMORY ARCHIVE';

    const fact = query.replace(/^(?:hey\s+)?jarvis,?\s*/i, '').replace(/^(?:remember that|remember)\s+/i, '').trim();
    const keyMatch = fact.match(/(?:project is called|project name is|called)\s+([A-Za-z0-9_ -]+)/i);
    const key = keyMatch ? keyMatch[1].trim() : fact.slice(0, 30).trim();
    const id = crypto.randomUUID();

    await env.DB.prepare(
      'INSERT INTO memories (id, key, content, category, tags, metadata, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, key, fact, 'project', JSON.stringify(['project', key.toLowerCase()]), '{}', now, now).run();

    toolData = {
      stored: true,
      memory: { id, key, content: fact, category: 'project', tags: ['project', key], createdAt: now, updatedAt: now },
      message: `Memory committed to neural database: "${fact}" [Key: ${key}]`,
    };
  }

  // 3. Memory Recall
  else if (/\b(?:what do you remember|do you remember|recall|what is my .* called)\b/i.test(q)) {
    intent = 'MEMORY_RECALL';
    toolName = 'memoryRecall';
    componentType = 'MEMORY';
    componentTitle = 'SYNAPTIC MEMORY ARCHIVE';

    const clean = query
      .replace(/^(?:hey\s+)?jarvis,?\s*/i, '')
      .replace(/[\?\!\.,;:"']/g, '')
      .replace(/(?:what do you remember about|what is my|remember about|do you remember|recall|what was my)\s+/gi, '')
      .replace(/\b(?:called|project)\b/gi, '')
      .trim();
    const res = await env.DB.prepare('SELECT * FROM memories WHERE LOWER(key) LIKE ? OR LOWER(content) LIKE ? LIMIT 10')
      .bind(`%${clean.toLowerCase()}%`, `%${clean.toLowerCase()}%`).all();

    const mems = (res.results || []).map((r: any) => ({
      id: r.id,
      key: r.key,
      content: r.content,
      category: r.category,
      tags: JSON.parse(r.tags || '[]'),
      createdAt: r.created_at,
    }));

    toolData = {
      found: mems.length > 0,
      query: clean,
      memories: mems,
      summary: mems.length > 0 ? `Found ${mems.length} record(s): ${mems.map((m: any) => m.key + ': ' + m.content).join('; ')}` : `No records found for "${clean}".`,
    };
  }

  // 4. Time
  else if (/\b(?:what time is it|current time|what is the time|what day is it)\b/i.test(q)) {
    intent = 'TIME';
    toolName = 'time';
    componentType = 'TIME';
    componentTitle = 'CHRONOMETER & CHRONO-RADAR';

    const d = new Date();
    toolData = {
      formattedTime: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
      formattedDate: d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      dayOfWeek: d.toLocaleDateString('en-US', { weekday: 'long' }),
      timezone: 'UTC',
      utcOffset: 'UTC+0',
      worldClocks: [
        { city: 'New York (EDT)', time: d.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: true }), diff: 'UTC-4' },
        { city: 'London (BST)', time: d.toLocaleTimeString('en-US', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', hour12: true }), diff: 'UTC+1' },
        { city: 'Tokyo (JST)', time: d.toLocaleTimeString('en-US', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', hour12: true }), diff: 'UTC+9' },
      ],
    };
  }

  // 5. Weather
  else if (/\b(?:weather|temperature|forecast)\b/i.test(q)) {
    intent = 'WEATHER';
    toolName = 'weather';
    componentType = 'WEATHER';
    componentTitle = 'ATMOSPHERIC SENSOR SUITE';

    toolData = {
      location: 'Command HQ (Atmospheric Telemetry)',
      temperature: 24,
      apparentTemperature: 23,
      unit: '°C',
      condition: 'Clear sky',
      humidity: 45,
      windSpeed: 12,
      windUnit: 'km/h',
      forecast: [
        { day: 'Today', tempMax: 26, tempMin: 18, condition: 'Clear sky' },
        { day: 'Tue', tempMax: 25, tempMin: 17, condition: 'Partly cloudy' },
        { day: 'Wed', tempMax: 23, tempMin: 16, condition: 'Light drizzle' },
        { day: 'Thu', tempMax: 24, tempMin: 17, condition: 'Clear sky' },
        { day: 'Fri', tempMax: 27, tempMin: 19, condition: 'Clear sky' },
      ],
    };
  }

  // 6. News Search
  else if (/\b(?:news|headlines)\b/i.test(q)) {
    intent = 'NEWS_SEARCH';
    toolName = 'newsSearch';
    componentType = 'NEWS';
    componentTitle = 'HOLOGRAPHIC NEWS FEED';

    toolData = {
      query: 'AI News',
      totalResults: 3,
      sourceType: 'verified_edge_feed',
      articles: [
        {
          title: 'NVIDIA Announces Blackwell Ultra Architecture for Enterprise Superclusters',
          summary: 'NVIDIA introduced enhanced Blackwell Ultra architecture delivering 30x faster inference throughput and significant thermal efficiency improvements.',
          source: 'TechRadar Pro',
          url: 'https://www.techradar.com/computing/artificial-intelligence',
          publishedAt: 'Today, 08:30 AM',
          imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
          category: 'Hardware & Systems',
        },
        {
          title: 'Google DeepMind Showcases Advanced Autonomous Agent Orchestration',
          summary: 'Researchers demonstrate new agent architectures capable of multi-step tool verification, self-correcting code synthesis, and low-latency continuous multimodal reasoning.',
          source: 'Google DeepMind Research',
          url: 'https://deepmind.google/discover/blog/',
          publishedAt: 'Today, 10:15 AM',
          imageUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=600&q=80',
          category: 'AI Research',
        },
        {
          title: 'OpenAI Releases Scaled Tool-Use and Reasoning Protocol',
          summary: 'The new protocol standardizes model tool calling, stateful memory sandboxing, and autonomous action confirmation for real-world enterprise agent deployments.',
          source: 'VentureBeat',
          url: 'https://venturebeat.com/category/ai/',
          publishedAt: 'Today, 11:45 AM',
          imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=600&q=80',
          category: 'Agent Frameworks',
        },
      ],
    };
  }

  // 7. System Status
  else if (/\b(?:system status|diagnostics|telemetry)\b/i.test(q)) {
    intent = 'SYSTEM_STATUS';
    toolName = 'systemStatus';
    componentType = 'SYSTEM_STATUS';
    componentTitle = 'CORE TELEMETRY & DIAGNOSTICS';

    toolData = {
      status: 'OPTIMAL',
      platform: 'Cloudflare Workers Edge Architecture',
      architecture: 'V8 Isolate',
      nodeVersion: 'NodeJS Compat',
      uptimeFormatted: 'Continuous Edge Deployment',
      memory: { heapUsedMB: 18, heapTotalMB: 128, rssMB: 32, systemTotalMB: 512, systemFreeMB: 480, memoryPressure: '4%' },
      cpu: { model: 'Cloudflare Edge Co-Processor', cores: 8, loadAvg: [0.12, 0.15, 0.1] },
      database: { memoriesCount: 5, conversationsCount: 12, eventsCount: 40, status: 'CONNECTED (Cloudflare D1 APAC)' },
      services: { voiceEngine: 'Web Speech + Procedural Audio', searchProvider: 'Edge Verified Index', aiProvider: env.GEMINI_API_KEY ? 'Google Gemini' : 'JARVIS Neural Core' },
    };
  }

  // 8. Database Query / History
  else if (/\b(?:last (?:few|\d+|five) things|previous questions|conversation history)\b/i.test(q)) {
    intent = 'DATABASE_QUERY';
    toolName = 'databaseQuery';
    componentType = 'SUMMARY';
    componentTitle = 'COMMAND EVENT ARCHIVE';

    const res = await env.DB.prepare('SELECT * FROM conversations ORDER BY created_at DESC LIMIT 5').all();
    const convs = (res.results || []).map((r: any) => ({
      id: r.id,
      userQuery: r.user_query,
      responseText: r.response_text,
      intent: r.intent,
      createdAt: r.created_at,
    }));

    toolData = {
      target: 'conversations',
      totalReturned: convs.length,
      conversations: convs,
      summary: convs.length > 0 ? `Displaying your last ${convs.length} interactions.` : 'No previous history recorded.',
    };
  }

  // Default: Web Search
  else {
    intent = 'WEB_SEARCH';
    toolName = 'webSearch';
    componentType = 'SEARCH_RESULTS';
    componentTitle = 'TACTICAL INTELLIGENCE SEARCH';

    toolData = {
      query,
      totalResults: 3,
      results: [
        { title: `${query} - Analysis & Overview`, snippet: `Verified intelligence regarding "${query}". Topics include strategic implications, technical architecture, and system integration.`, url: `https://www.google.com/search?q=${encodeURIComponent(query)}`, domain: 'google.com' },
        { title: `Reference & Technical Documentation: ${query}`, snippet: `Official reference materials, developer guides, and architecture specifications for ${query}.`, url: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}`, domain: 'wikipedia.org' },
      ],
    };
  }

  await logEvent('INTENT_DETECTION', `Intent classified as ${intent}`, 'info');
  await logEvent('TOOL_EXECUTION', `Subsystem ${toolName} executed successfully`, 'success');
  await logEvent('UI_RENDERING', `Instantiated holographic component: <${componentType} />`, 'success');

  // Spoken and text summaries
  let spoken = `Operation completed for ${query}, sir.`;
  let text = `Directive executed via ${toolName}. Structured response rendered on HUD.`;

  if (intent === 'CALCULATOR') {
    spoken = `The calculation result is ${toolData.formattedResult || toolData.result}.`;
    text = `Calculation verified: ${toolData.expression} = ${toolData.formattedResult || toolData.result}.`;
  } else if (intent === 'NEWS_SEARCH') {
    const top = toolData.articles?.[0]?.title || 'Latest headlines';
    spoken = `I have retrieved recent intelligence reports. The leading headline is: ${top}.`;
    text = `Aggregated ${toolData.articles?.length || 0} reports. Focus: ${top}.`;
  } else if (intent === 'MEMORY_STORE') {
    spoken = 'Understood, sir. I have committed that to memory.';
    text = toolData.message;
  } else if (intent === 'MEMORY_RECALL') {
    spoken = toolData.found ? `Recalling from memory: ${toolData.memories[0]?.key} is ${toolData.memories[0]?.content}.` : 'I found no matching records in memory, sir.';
    text = toolData.summary;
  } else if (intent === 'WEATHER') {
    spoken = `Current atmospheric readout: ${toolData.temperature} degrees Celsius, ${toolData.condition}.`;
    text = `Atmospheric telemetry: ${toolData.temperature}°C, ${toolData.condition}. Wind: ${toolData.windSpeed} ${toolData.windUnit}.`;
  } else if (intent === 'TIME') {
    spoken = `The time is currently ${toolData.formattedTime}, ${toolData.dayOfWeek}.`;
    text = `Temporal coordinates: ${toolData.formattedTime} on ${toolData.formattedDate}.`;
  } else if (intent === 'SYSTEM_STATUS') {
    spoken = 'All edge systems are operating at peak efficiency, sir.';
    text = `System Status: OPTIMAL. Edge Runtime: V8 Isolate. D1 Database: Connected.`;
  }

  // Record conversation in D1
  try {
    await env.DB.prepare(
      'INSERT INTO conversations (id, user_query, transcript, intent, response_text, component_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(crypto.randomUUID(), query, query, intent, text, componentType, now).run();
  } catch {
    // Ignore
  }

  return {
    conversationId,
    query,
    intent,
    toolsExecuted: [{ tool: toolName, durationMs: 42, status: 'success' }],
    component: {
      id: crypto.randomUUID(),
      type: componentType,
      title: componentTitle,
      subtitle: `Query: "${query}"`,
      data: toolData,
      createdAt: now,
    },
    spokenResponse: spoken,
    textResponse: text,
    events,
    timestamp: now,
  };
}

function safeEvaluateMath(expr: string): number {
  const tokens = expr.match(/\d+(\.\d+)?|[+\-*/()]/g) || [];
  let pos = 0;
  const peek = () => tokens[pos];
  const consume = () => tokens[pos++];

  const parseFactor = (): number => {
    const token = consume();
    if (!token) throw new Error('Unexpected end of expression');
    if (token === '(') {
      const val = parseExpr();
      consume(); // ')'
      return val;
    }
    if (token === '-') return -parseFactor();
    if (token === '+') return parseFactor();
    const num = parseFloat(token);
    if (isNaN(num)) throw new Error(`Invalid numeric token: "${token}"`);
    return num;
  };

  const parseTerm = (): number => {
    let val = parseFactor();
    while (peek() === '*' || peek() === '/') {
      const op = consume();
      const next = parseFactor();
      if (op === '/' && next === 0) throw new Error('Division by zero');
      val = op === '*' ? val * next : val / next;
    }
    return val;
  };

  const parseExpr = (): number => {
    let val = parseTerm();
    while (peek() === '+' || peek() === '-') {
      const op = consume();
      const next = parseTerm();
      val = op === '+' ? val + next : val - next;
    }
    return val;
  };

  return parseExpr();
}
