import React from 'react';
import { FileText, History } from 'lucide-react';

interface SummaryCardProps {
  title?: string;
  data: {
    text?: string;
    summary?: string;
    conversations?: Array<{
      id: string;
      userQuery: string;
      responseText: string;
      intent: string;
      createdAt: string;
    }>;
    totalReturned?: number;
  };
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ data }) => {
  const conversations = data.conversations;

  if (conversations && conversations.length > 0) {
    return (
      <div className="p-4 space-y-3 max-h-[460px] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between text-xs font-mono text-hud-muted border-b border-hud-cyan/20 pb-2">
          <span className="flex items-center gap-1.5 text-hud-cyan">
            <History className="w-3.5 h-3.5" />
            PRIOR INTERACTION LOGS
          </span>
          <span>{conversations.length} Entries</span>
        </div>

        <div className="space-y-2.5">
          {conversations.map((item, idx) => (
            <div
              key={idx}
              className="p-3 bg-hud-bg/60 border border-hud-cyan/20 rounded-lg space-y-1.5"
            >
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-hud-cyan font-bold">USER DIRECTIVE:</span>
                <span className="text-hud-muted">
                  {new Date(item.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="text-xs font-mono text-hud-text font-medium">
                "{item.userQuery}"
              </p>

              <div className="text-[11px] font-mono text-hud-green pt-1 border-t border-hud-cyan/10">
                JARVIS RESPONSE:
              </div>
              <p className="text-xs font-sans text-hud-text/80">
                {item.responseText}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const content = data.summary || data.text || 'Intelligence synthesized and ready.';

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-1.5 text-xs font-mono text-hud-cyan border-b border-hud-cyan/20 pb-2">
        <FileText className="w-3.5 h-3.5" />
        OPERATIONAL BRIEFING
      </div>

      <div className="p-3 bg-hud-bg/60 border border-hud-cyan/20 rounded-lg font-sans text-sm text-hud-text/90 leading-relaxed whitespace-pre-wrap">
        {content}
      </div>
    </div>
  );
};

