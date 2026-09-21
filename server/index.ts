import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { processCommand } from './orchestrator.js';
import { memoryRepo, eventRepo, conversationRepo } from './db/index.js';
import { toolRegistry } from './tools/registry.js';
import { getAIProvider } from './ai/provider.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// 1. POST /api/command - Primary Orchestration Endpoint
app.post('/api/command', async (req: Request, res: Response) => {
  try {
    const { text, conversationId, demoMode } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Field "text" is required and must be a string.' });
    }

    const response = await processCommand({
      text,
      conversationId,
      demoMode: Boolean(demoMode),
    });

    return res.json(response);
  } catch (err: any) {
    console.error('[Error processing command]', err);
    return res.status(500).json({
      error: 'Internal JARVIS orchestration error',
      details: err.message,
    });
  }
});

// 2. POST /api/search - Direct search endpoint
app.post('/api/search', async (req: Request, res: Response) => {
  try {
    const { query, type = 'web', limit = 4 } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const toolName = type === 'news' ? 'newsSearch' : 'webSearch';
    const results = await toolRegistry.execute(
      toolName,
      { query, limit: Number(limit) },
      { db: null, demoMode: process.env.DEMO_MODE === 'true' }
    );

    return res.json(results);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. POST /api/memory - Store a memory
app.post('/api/memory', (req: Request, res: Response) => {
  try {
    const { key, content, category = 'general', tags = [], metadata = {} } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Field "content" is required.' });
    }

    const memoryKey = key || content.slice(0, 30);
    const saved = memoryRepo.save(memoryKey, content, category, tags, metadata);
    return res.status(201).json(saved);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 4. GET /api/memory - List or query memories
app.get('/api/memory', (req: Request, res: Response) => {
  try {
    const { q, limit } = req.query;
    if (q && typeof q === 'string') {
      const results = memoryRepo.search(q);
      return res.json({ memories: results });
    }

    const results = memoryRepo.list(limit ? Number(limit) : 50);
    return res.json({ memories: results });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 5. DELETE /api/memory/:id - Delete memory
app.delete('/api/memory/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    memoryRepo.delete(id);
    return res.json({ success: true, deletedId: id });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 6. POST /api/events - Log custom event
app.post('/api/events', (req: Request, res: Response) => {
  try {
    const { type, details, status = 'info', conversationId } = req.body;
    if (!type || !details) {
      return res.status(400).json({ error: 'type and details are required' });
    }
    const evt = eventRepo.create(type, details, status, conversationId);
    return res.status(201).json(evt);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 7. GET /api/events - Recent activity stream
app.get('/api/events', (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const events = eventRepo.list(limit ? Number(limit) : 40);
    return res.json({ events });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 8. GET /api/conversations - Recent dialogs
app.get('/api/conversations', (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const conversations = conversationRepo.list(limit ? Number(limit) : 20);
    return res.json({ conversations });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 9. GET /api/status - System and health status
app.get('/api/status', (req: Request, res: Response) => {
  try {
    const ai = getAIProvider();
    const isDemo = process.env.DEMO_MODE === 'true' || (!process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY);

    return res.json({
      status: 'ONLINE',
      system: 'JARVIS AI COMMAND CENTER',
      version: '1.0.0-PROTOTYPE',
      uptime: Math.floor(process.uptime()),
      demoMode: isDemo,
      aiProvider: ai.name,
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
      activeToolsCount: toolRegistry.list().length,
      tools: toolRegistry.list().map((t) => t.name),
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`\n=================================================`);
    console.log(`⚡ JARVIS AI CORE ONLINE: http://localhost:${PORT}`);
    console.log(`⚡ AI Model Provider: ${getAIProvider().name}`);
    console.log(`⚡ Tool Registry Active: ${toolRegistry.list().length} subsystems loaded`);
    console.log(`=================================================\n`);
  });
}

export default app;

