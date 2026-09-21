import React, { useState, useEffect, useRef } from 'react';
import { Activity, ChevronRight, ChevronLeft, ShieldCheck, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { JarvisEvent } from '../types';

interface ActivityStreamProps {
  events: JarvisEvent[];
  isExpandedDefault?: boolean;
}

export const ActivityStream: React.FC<ActivityStreamProps> = ({ events, isExpandedDefault = true }) => {
  const [expanded, setExpanded] = useState(isExpandedDefault);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-3.5 h-3.5 text-hud-green shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-3.5 h-3.5 text-hud-gold shrink-0" />;
      case 'error':
        return <AlertTriangle className="w-3.5 h-3.5 text-hud-red shrink-0" />;
      case 'info':
      default:
        return <Info className="w-3.5 h-3.5 text-hud-cyan shrink-0" />;
    }
  };

  return (
    <div
      className={`fixed top-20 right-4 z-20 transition-all duration-300 pointer-events-auto ${
        expanded ? 'w-72 sm:w-80' : 'w-10'
      }`}
    >
      <div className="bg-hud-panel border border-hud-cyan/30 rounded-xl shadow-glow-cyan backdrop-blur-xl overflow-hidden flex flex-col max-h-[calc(100vh-180px)]">
        {/* Stream Header */}
        <div
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between px-3 py-2 bg-black/60 border-b border-hud-cyan/20 cursor-pointer hover:bg-hud-cyan/10 transition-colors"
        >
          <div className="flex items-center gap-2 truncate">
            <Activity className="w-4 h-4 text-hud-cyan shrink-0 animate-pulse" />
            {expanded && (
              <span className="font-hud font-bold text-xs tracking-wider text-hud-cyan truncate">
                LIVE TELEMETRY STREAM
              </span>
            )}
          </div>

          <button className="text-hud-muted hover:text-hud-cyan p-0.5">
            {expanded ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Stream Items List */}
        {expanded && (
          <div
            ref={scrollRef}
            className="p-2.5 space-y-2 overflow-y-auto custom-scrollbar flex-1 font-mono text-[11px]"
          >
            {events.length === 0 ? (
              <div className="text-center py-6 text-hud-muted">
                <ShieldCheck className="w-5 h-5 mx-auto mb-1 opacity-50" />
                <span>Monitoring operational telemetry</span>
              </div>
            ) : (
              events.map((evt) => (
                <div
                  key={evt.id}
                  className="p-2 rounded bg-black/40 border border-hud-cyan/15 hover:border-hud-cyan/40 transition-colors space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {getStatusIcon(evt.status)}
                      <span className="font-bold text-hud-cyan text-[10px] uppercase tracking-wider">
                        {evt.type}
                      </span>
                    </div>
                    <span className="text-[10px] text-hud-muted">
                      {new Date(evt.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="text-hud-text/80 leading-relaxed font-sans text-xs break-words">
                    {evt.details}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

