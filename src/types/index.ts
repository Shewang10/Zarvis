export type CoreState =
  | 'IDLE'
  | 'LISTENING'
  | 'PROCESSING'
  | 'SEARCHING'
  | 'EXECUTING_TOOL'
  | 'SPEAKING'
  | 'ERROR';

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

export interface FloatingWindow {
  id: string;
  component: DynamicUIComponent;
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
}

export interface JarvisEvent {
  id: string;
  conversationId?: string;
  type: string;
  status: 'info' | 'success' | 'warning' | 'error';
  details: string;
  timestamp: string;
}

export interface ConversationItem {
  id: string;
  query: string;
  response: string;
  spoken: string;
  intent: string;
  component?: DynamicUIComponent;
  timestamp: string;
}

export interface SystemStatusData {
  status: string;
  system: string;
  version: string;
  uptime: number;
  demoMode: boolean;
  aiProvider: string;
  hasGeminiKey: boolean;
  hasOpenAIKey: boolean;
  activeToolsCount: number;
  tools: string[];
}

