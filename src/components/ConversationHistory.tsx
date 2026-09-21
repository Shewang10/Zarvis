import React, { useState } from 'react';
import { MessageSquare, ChevronLeft, ChevronRight, Volume2, User, Bot } from 'lucide-react';
import { ConversationItem } from '../types';

interface ConversationHistoryProps {
  conversations: ConversationItem[];
  onReplayAudio: (text: string) => void;
}

export const ConversationHistory: React.FC<ConversationHistoryProps> = ({
  conversations,
  onReplayAudio,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`fixed top-20 left-4 z-20 transition-all duration-300 pointer-events-auto ${
        open ? 'w-72 sm:w-80' : 'w-10'
      }`}
    >
      <div className="bg-hud-panel border border-hud-cyan/30 rounded-xl shadow-glow-cyan backdrop-blur-xl overflow-hidden flex flex-col max-h-[calc(100vh-180px)]">
        {/* Header */}
        <div
          onClick={() => setOpen(!open)}
          className="flex items-center justify-between px-3 py-2 bg-black/60 border-b border-hud-cyan/20 cursor-pointer hover:bg-hud-cyan/10 transition-colors"
        >
          <div className="flex items-center gap-2 truncate">
            <MessageSquare className="w-4 h-4 text-hud-cyan shrink-0" />
            {open && (
              <span className="font-hud font-bold text-xs tracking-wider text-hud-cyan truncate">
                CONVERSATION LOG
              </span>
            )}
          </div>

          <button className="text-hud-muted hover:text-hud-cyan p-0.5">
            {open ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Conversation List */}
        {open && (
          <div className="p-2.5 space-y-3 overflow-y-auto custom-scrollbar flex-1 font-mono text-xs">
            {conversations.length === 0 ? (
              <div className="text-center py-6 text-hud-muted text-xs">
                No voice dialogues recorded yet. Say "Hey Jarvis" to begin.
              </div>
            ) : (
              conversations.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-lg bg-black/40 border border-hud-cyan/15 hover:border-hud-cyan/40 transition-colors space-y-2"
                >
                  {/* User Entry */}
                  <div className="flex items-start gap-2">
                    <div className="p-1 rounded bg-hud-cyan/10 text-hud-cyan shrink-0 mt-0.5">
                      <User className="w-3 h-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-[10px] text-hud-muted mb-0.5">
                        <span className="text-hud-cyan font-bold">USER</span>
                        <span>
                          {new Date(item.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-hud-text font-medium text-xs break-words">
                        "{item.query}"
                      </p>
                    </div>
                  </div>

                  {/* JARVIS Response */}
                  <div className="flex items-start gap-2 pt-1 border-t border-hud-cyan/10">
                    <div className="p-1 rounded bg-hud-green/10 text-hud-green shrink-0 mt-0.5">
                      <Bot className="w-3 h-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-[10px] text-hud-muted mb-0.5">
                        <span className="text-hud-green font-bold">JARVIS</span>
                        <button
                          onClick={() => onReplayAudio(item.spoken)}
                          className="flex items-center gap-1 text-[10px] text-hud-cyan hover:text-white transition-colors"
                          title="Replay Voice Briefing"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>REPLAY</span>
                        </button>
                      </div>
                      <p className="text-hud-text/80 font-sans text-xs break-words leading-relaxed">
                        {item.response}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

