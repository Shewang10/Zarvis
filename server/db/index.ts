import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { MemoryRecord, ConversationRecord, JarvisEvent, ToolExecutionRecord } from '../types.js';

const DB_PATH = process.env.DATABASE_PATH || path.resolve(process.cwd(), 'server/db/jarvis.sqlite');

// Ensure db directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let dbInstance: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(DB_PATH);
    initDatabase(dbInstance);
  }
  return dbInstance;
}

function initDatabase(db: DatabaseSync): void {
  // Optimize concurrency and avoid locks
  try {
    db.exec('PRAGMA journal_mode = WAL;');
    db.exec('PRAGMA busy_timeout = 5000;');
  } catch {
    // Ignore in unsupported environments
  }

  const schemaPath = path.resolve(__dirname, 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schemaSql);
  } else {
    // Fallback embedded schema
    db.exec(`
      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        key TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT DEFAULT 'general',
        tags TEXT DEFAULT '[]',
        metadata TEXT DEFAULT '{}',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_memories_key ON memories(key);
      CREATE INDEX IF NOT EXISTS idx_memories_category ON memories(category);

      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        user_query TEXT NOT NULL,
        transcript TEXT,
        intent TEXT,
        response_text TEXT NOT NULL,
        component_type TEXT,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_conversations_created ON conversations(created_at DESC);

      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        conversation_id TEXT,
        event_type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'info',
        details TEXT,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at DESC);

      CREATE TABLE IF NOT EXISTS tool_executions (
        id TEXT PRIMARY KEY,
        tool_name TEXT NOT NULL,
        input_payload TEXT,
        output_payload TEXT,
        duration_ms INTEGER NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_tool_executions_created ON tool_executions(created_at DESC);
    `);
  }
}

export const memoryRepo = {
  save(
    key: string,
    content: string,
    category = 'general',
    tags: string[] = [],
    metadata: Record<string, any> = {}
  ): MemoryRecord {
    const db = getDatabase();
    const now = new Date().toISOString();

    // Check if memory for this key exists
    const existing = db
      .prepare('SELECT id, created_at FROM memories WHERE LOWER(key) = LOWER(?) LIMIT 1')
      .get(key) as any;

    if (existing) {
      db.prepare(
        `UPDATE memories 
         SET content = ?, category = ?, tags = ?, metadata = ?, updated_at = ? 
         WHERE id = ?`
      ).run(content, category, JSON.stringify(tags), JSON.stringify(metadata), now, existing.id);

      return {
        id: existing.id,
        key,
        content,
        category,
        tags,
        metadata,
        createdAt: existing.created_at,
        updatedAt: now,
      };
    } else {
      const id = crypto.randomUUID();
      db.prepare(
        `INSERT INTO memories (id, key, content, category, tags, metadata, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(id, key, content, category, JSON.stringify(tags), JSON.stringify(metadata), now, now);

      return {
        id,
        key,
        content,
        category,
        tags,
        metadata,
        createdAt: now,
        updatedAt: now,
      };
    }
  },

  search(term: string): MemoryRecord[] {
    const db = getDatabase();
    const wildcard = `%${term.toLowerCase()}%`;
    const rows = db
      .prepare(
        `SELECT * FROM memories 
         WHERE LOWER(key) LIKE ? OR LOWER(content) LIKE ? OR LOWER(tags) LIKE ?
         ORDER BY updated_at DESC LIMIT 20`
      )
      .all(wildcard, wildcard, wildcard) as any[];

    return rows.map((r) => ({
      id: r.id,
      key: r.key,
      content: r.content,
      category: r.category,
      tags: JSON.parse(r.tags || '[]'),
      metadata: JSON.parse(r.metadata || '{}'),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  },

  getByKey(key: string): MemoryRecord | null {
    const db = getDatabase();
    const r = db
      .prepare('SELECT * FROM memories WHERE LOWER(key) = LOWER(?) LIMIT 1')
      .get(key) as any;

    if (!r) return null;
    return {
      id: r.id,
      key: r.key,
      content: r.content,
      category: r.category,
      tags: JSON.parse(r.tags || '[]'),
      metadata: JSON.parse(r.metadata || '{}'),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  },

  list(limit = 50): MemoryRecord[] {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM memories ORDER BY updated_at DESC LIMIT ?')
      .all(limit) as any[];

    return rows.map((r) => ({
      id: r.id,
      key: r.key,
      content: r.content,
      category: r.category,
      tags: JSON.parse(r.tags || '[]'),
      metadata: JSON.parse(r.metadata || '{}'),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  },

  delete(id: string): boolean {
    const db = getDatabase();
    db.prepare('DELETE FROM memories WHERE id = ?').run(id);
    return true;
  },
};

export const conversationRepo = {
  create(
    query: string,
    response: string,
    intent: string,
    componentType?: string,
    transcript?: string
  ): ConversationRecord {
    const db = getDatabase();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO conversations (id, user_query, transcript, intent, response_text, component_type, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(id, query, transcript || query, intent, response, componentType || null, now);

    return {
      id,
      userQuery: query,
      transcript: transcript || query,
      intent,
      responseText: response,
      componentType,
      createdAt: now,
    };
  },

  list(limit = 20): ConversationRecord[] {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM conversations ORDER BY created_at DESC LIMIT ?')
      .all(limit) as any[];

    return rows.map((r) => ({
      id: r.id,
      userQuery: r.user_query,
      transcript: r.transcript,
      intent: r.intent,
      responseText: r.response_text,
      componentType: r.component_type,
      createdAt: r.created_at,
    }));
  },
};

export const eventRepo = {
  create(
    type: string,
    details: string,
    status: 'info' | 'success' | 'warning' | 'error' = 'info',
    conversationId?: string
  ): JarvisEvent {
    const db = getDatabase();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO events (id, conversation_id, event_type, status, details, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, conversationId || null, type, status, details, now);

    return {
      id,
      conversationId,
      type,
      status,
      details,
      timestamp: now,
    };
  },

  list(limit = 50): JarvisEvent[] {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM events ORDER BY created_at DESC LIMIT ?')
      .all(limit) as any[];

    return rows.map((r) => ({
      id: r.id,
      conversationId: r.conversation_id,
      type: r.event_type,
      status: r.status,
      details: r.details,
      timestamp: r.created_at,
    }));
  },
};

export const toolExecutionRepo = {
  record(
    toolName: string,
    input: any,
    output: any,
    durationMs: number,
    status: 'success' | 'error'
  ): ToolExecutionRecord {
    const db = getDatabase();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO tool_executions (id, tool_name, input_payload, output_payload, duration_ms, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(id, toolName, JSON.stringify(input), JSON.stringify(output), durationMs, status, now);

    return {
      id,
      toolName,
      inputPayload: input,
      outputPayload: output,
      durationMs,
      status,
      createdAt: now,
    };
  },

  list(limit = 20): ToolExecutionRecord[] {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM tool_executions ORDER BY created_at DESC LIMIT ?')
      .all(limit) as any[];

    return rows.map((r) => ({
      id: r.id,
      toolName: r.tool_name,
      inputPayload: JSON.parse(r.input_payload || '{}'),
      outputPayload: JSON.parse(r.output_payload || '{}'),
      durationMs: r.duration_ms,
      status: r.status,
      createdAt: r.created_at,
    }));
  },
};
