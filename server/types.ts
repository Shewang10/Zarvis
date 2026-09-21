export type IntentType =
  | 'NEWS_SEARCH'
  | 'WEB_SEARCH'
  | 'CALCULATOR'
  | 'MEMORY_STORE'
  | 'MEMORY_RECALL'
  | 'WEATHER'
  | 'SYSTEM_STATUS'
  | 'TIME'
  | 'DATABASE_QUERY'
  | 'GENERAL_CONVERSATION';

export type ComponentType =
  | 'NEWS'
  | 'SEARCH_RESULTS'
  | 'WEATHER'
  | 'CALCULATION'
  | 'MEMORY'
  | 'SYSTEM_STATUS'
  | 'TIME'
  | 'CHART'
  | 'SUMMARY'
  | 'ALERT';

export interface DynamicUIComponent {
  id: string;
  type: ComponentType;
  title: string;
  subtitle?: string;
  data: any;
  actions?: Array<{
    label: string;
    action: string;
    payload?: any;
  }>;
  createdAt: string;
}

export interface JarvisEvent {
  id: string;
  conversationId?: string;
  type: string;
  status: 'info' | 'success' | 'warning' | 'error';
  details: string;
  timestamp: string;
}

export interface ToolExecutionRecord {
  id: string;
  toolName: string;
  inputPayload: any;
  outputPayload: any;
  durationMs: number;
  status: 'success' | 'error';
  createdAt: string;
}

export interface MemoryRecord {
  id: string;
  key: string;
  content: string;
  category: string;
  tags: string[];
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationRecord {
  id: string;
  userQuery: string;
  transcript?: string;
  intent: string;
  responseText: string;
  componentType?: string;
  createdAt: string;
}

export interface CommandRequest {
  text: string;
  conversationId?: string;
  demoMode?: boolean;
}

export interface CommandResponse {
  conversationId: string;
  query: string;
  intent: IntentType;
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

export interface ToolContext {
  db: any;
  demoMode: boolean;
}

export interface ToolDefinition<TInput = any, TOutput = any> {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  execute: (input: TInput, context: ToolContext) => Promise<TOutput>;
}

