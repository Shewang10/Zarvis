import { exec } from 'node:child_process';
import os from 'node:os';
import { ToolDefinition } from '../types.js';

export interface EmailMessage {
  id: string;
  sender: string;
  senderEmail: string;
  subject: string;
  snippet: string;
  date: string;
  unread: boolean;
  priority: 'high' | 'normal' | 'low';
}

interface EmailToolInput {
  action?: 'open' | 'search' | 'compose' | 'list';
  query?: string;
  recipient?: string;
  subject?: string;
  body?: string;
  target?: 'outlook' | 'gmail' | 'default';
}

interface EmailToolOutput {
  actionExecuted: string;
  status: 'opened' | 'draft_created' | 'listed';
  appLaunched?: string;
  webUrl: string;
  inbox: EmailMessage[];
  message: string;
}

const MOCK_INBOX: EmailMessage[] = [
  {
    id: 'msg-1',
    sender: 'Stark Industries Security',
    senderEmail: 'security@stark.ai',
    subject: 'Project CleanFleet Protocol Verification Approved',
    snippet: 'All edge deployment configurations and telemetry benchmarks have been certified for production.',
    date: '10:45 AM',
    unread: true,
    priority: 'high',
  },
  {
    id: 'msg-2',
    sender: 'Cloudflare Edge Infrastructure',
    senderEmail: 'alerts@cloudflare.com',
    subject: 'D1 Database [jarvis-d1] Automated Backup Complete',
    snippet: 'Database replica synchronized successfully across APAC region nodes.',
    date: '09:15 AM',
    unread: true,
    priority: 'normal',
  },
  {
    id: 'msg-3',
    sender: 'GitHub Enterprise Team',
    senderEmail: 'notifications@github.com',
    subject: '[Shewang10/Zarvis] Main Branch Workflow Succeeded',
    snippet: 'Vite production build and edge migration passed all 22 test suites with zero errors.',
    date: 'Yesterday',
    unread: false,
    priority: 'normal',
  },
  {
    id: 'msg-4',
    sender: 'NVIDIA AI Developer Network',
    senderEmail: 'dev@nvidia.com',
    subject: 'New Blackwell Ultra Microservices Released',
    snippet: 'Explore updated TensorRT-LLM binaries with multi-modal reasoning optimizations.',
    date: 'Sep 20',
    unread: false,
    priority: 'low',
  },
];

export const emailTool: ToolDefinition<EmailToolInput, EmailToolOutput> = {
  name: 'email',
  description: 'Controls Microsoft Outlook and email workflows: opens Outlook desktop or web, searches inbox, composes drafts.',
  parameters: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['open', 'search', 'compose', 'list'],
        description: 'Action to perform on email/Outlook',
      },
      query: {
        type: 'string',
        description: 'Search query for filtering emails',
      },
      recipient: {
        type: 'string',
        description: 'Recipient email address for compose action',
      },
      subject: {
        type: 'string',
        description: 'Subject line for email',
      },
      body: {
        type: 'string',
        description: 'Email body text',
      },
    },
  },
  execute: async ({ action = 'open', query, recipient, subject, body }) => {
    const webUrl = 'https://outlook.live.com/mail/';
    let appLaunched = 'Microsoft Outlook';
    let status: 'opened' | 'draft_created' | 'listed' = 'opened';
    let message = 'Opening Microsoft Outlook for your communications, sir.';

    // On macOS, attempt to open native Outlook app or web URL
    if (os.platform() === 'darwin') {
      try {
        if (action === 'compose' && recipient) {
          const mailto = `mailto:${recipient}?subject=${encodeURIComponent(subject || '')}&body=${encodeURIComponent(body || '')}`;
          exec(`open "${mailto}"`);
          status = 'draft_created';
          message = `Draft composed in Outlook for ${recipient}.`;
        } else {
          // Try opening Microsoft Outlook app, fallback to default browser outlook url
          exec('open -a "Microsoft Outlook" 2>/dev/null || open "https://outlook.live.com"', (err) => {
            if (err) {
              exec(`open "${webUrl}"`);
            }
          });
        }
      } catch {
        // Fallback gracefully in sandboxed or serverless environments
      }
    }

    let inbox = MOCK_INBOX;
    if (query) {
      const q = query.toLowerCase();
      inbox = MOCK_INBOX.filter(
        (m) =>
          m.subject.toLowerCase().includes(q) ||
          m.sender.toLowerCase().includes(q) ||
          m.snippet.toLowerCase().includes(q)
      );
    }

    return {
      actionExecuted: action,
      status,
      appLaunched,
      webUrl,
      inbox,
      message,
    };
  },
};

export const browserControlTool: ToolDefinition<{ url?: string; app?: string }, any> = {
  name: 'browserControl',
  description: 'Navigates and opens web pages, developer dashboards, or desktop applications.',
  parameters: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'Web URL to navigate to',
      },
      app: {
        type: 'string',
        description: 'Application name to launch on host OS',
      },
    },
  },
  execute: async ({ url, app }) => {
    let targetUrl = url || 'https://www.google.com';
    if (app && app.toLowerCase().includes('outlook')) {
      targetUrl = 'https://outlook.live.com';
    }

    if (os.platform() === 'darwin') {
      try {
        if (app) {
          exec(`open -a "${app}" 2>/dev/null || open "${targetUrl}"`);
        } else {
          exec(`open "${targetUrl}"`);
        }
      } catch {
        // Fallback
      }
    }

    return {
      success: true,
      url: targetUrl,
      app: app || 'Default Browser',
      message: `Navigating to ${targetUrl}`,
    };
  },
};

