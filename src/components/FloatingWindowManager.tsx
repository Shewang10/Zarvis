import React, { useState, useEffect } from 'react';
import { FloatingWindow } from '../types';
import { DynamicResponseRenderer } from './renderer/DynamicResponseRenderer';
import {
  X,
  Minus,
  Maximize2,
  Minimize2,
  Layers,
  Terminal,
} from 'lucide-react';

interface FloatingWindowManagerProps {
  windows: FloatingWindow[];
  onClose: (id: string) => void;
  onToggleMinimize: (id: string) => void;
  onToggleMaximize: (id: string) => void;
  onFocus: (id: string) => void;
}

export const FloatingWindowManager: React.FC<FloatingWindowManagerProps> = ({
  windows,
  onClose,
  onToggleMinimize,
  onToggleMaximize,
  onFocus,
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [dragState, setDragState] = useState<{
    windowId: string | null;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  }>({
    windowId: null,
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  });

  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMouseDown = (e: React.MouseEvent, w: FloatingWindow) => {
    if (isMobile || w.isMaximized) return;
    onFocus(w.id);

    const cur = positions[w.id] || { x: w.x, y: w.y };
    setDragState({
      windowId: w.id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: cur.x,
      initialY: cur.y,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState.windowId) return;
      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;

      setPositions((prev) => ({
        ...prev,
        [dragState.windowId!]: {
          x: Math.max(10, Math.min(window.innerWidth - 300, dragState.initialX + dx)),
          y: Math.max(60, Math.min(window.innerHeight - 150, dragState.initialY + dy)),
        },
      }));
    };

    const handleMouseUp = () => {
      if (dragState.windowId) {
        setDragState({
          windowId: null,
          startX: 0,
          startY: 0,
          initialX: 0,
          initialY: 0,
        });
      }
    };

    if (dragState.windowId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState]);

  // Minimized windows dock
  const minimizedWindows = windows.filter((w) => w.isMinimized);
  const activeWindows = windows.filter((w) => !w.isMinimized);

  if (windows.length === 0) return null;

  return (
    <>
      {/* Mobile Stack Mode */}
      {isMobile ? (
        <div className="fixed inset-x-0 bottom-24 top-20 z-30 overflow-y-auto p-3 space-y-3 pointer-events-auto custom-scrollbar">
          {activeWindows.map((w) => (
            <div
              key={w.id}
              className="bg-hud-bg/95 border border-hud-cyan/40 rounded-xl shadow-glow-cyan backdrop-blur-xl overflow-hidden transition-all"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-3.5 py-2.5 bg-black/60 border-b border-hud-cyan/30">
                <div className="flex items-center gap-2 truncate">
                  <Terminal className="w-3.5 h-3.5 text-hud-cyan shrink-0" />
                  <span className="font-hud font-bold text-xs text-hud-cyan truncate">
                    {w.component.title}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onClose(w.id)}
                    className="p-1 text-hud-muted hover:text-hud-red rounded hover:bg-white/5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <DynamicResponseRenderer component={w.component} />
            </div>
          ))}
        </div>
      ) : (
        /* Desktop Floating Windows */
        <div className="pointer-events-none fixed inset-0 z-30">
          {activeWindows.map((w) => {
            const pos = positions[w.id] || { x: w.x, y: w.y };

            const isMax = w.isMaximized;
            const style: React.CSSProperties = isMax
              ? {
                  position: 'fixed',
                  top: '70px',
                  left: '320px',
                  right: '320px',
                  bottom: '100px',
                  zIndex: w.zIndex + 50,
                  width: 'auto',
                  height: 'auto',
                }
              : {
                  position: 'absolute',
                  top: `${pos.y}px`,
                  left: `${pos.x}px`,
                  width: `${w.width}px`,
                  zIndex: w.zIndex,
                };

            return (
              <div
                key={w.id}
                style={style}
                onClick={() => onFocus(w.id)}
                className="pointer-events-auto bg-hud-panel border border-hud-cyan/40 rounded-xl shadow-glow-cyan backdrop-blur-xl flex flex-col overflow-hidden transition-shadow duration-300 hover:border-hud-cyan/70 hover:shadow-[0_0_25px_rgba(0,240,255,0.4)]"
              >
                {/* Holographic Header / Drag Bar */}
                <div
                  onMouseDown={(e) => handleMouseDown(e, w)}
                  className="flex items-center justify-between px-3.5 py-2.5 bg-black/60 border-b border-hud-cyan/30 cursor-move select-none"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-full bg-hud-cyan animate-pulse shadow-glow-cyan shrink-0" />
                    <span className="font-hud font-bold text-xs tracking-wider text-hud-cyan truncate">
                      {w.component.title}
                    </span>
                    {w.component.subtitle && (
                      <span className="text-[11px] font-mono text-hud-muted truncate hidden sm:inline">
                        // {w.component.subtitle}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleMinimize(w.id);
                      }}
                      className="p-1 rounded text-hud-muted hover:text-hud-cyan hover:bg-hud-cyan/10 transition-colors"
                      title="Minimize"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleMaximize(w.id);
                      }}
                      className="p-1 rounded text-hud-muted hover:text-hud-cyan hover:bg-hud-cyan/10 transition-colors"
                      title={isMax ? 'Restore' : 'Maximize'}
                    >
                      {isMax ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onClose(w.id);
                      }}
                      className="p-1 rounded text-hud-muted hover:text-hud-red hover:bg-hud-red/10 transition-colors"
                      title="Close"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Body Component */}
                <div className="flex-1 overflow-auto">
                  <DynamicResponseRenderer component={w.component} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Minimized Dock Bar */}
      {minimizedWindows.length > 0 && (
        <div className="fixed bottom-20 left-4 z-40 flex items-center gap-2 pointer-events-auto">
          {minimizedWindows.map((w) => (
            <button
              key={w.id}
              onClick={() => onToggleMinimize(w.id)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-hud-panel/90 border border-hud-cyan/40 hover:border-hud-cyan text-xs font-hud text-hud-cyan shadow-glow-cyan backdrop-blur-md transition-all hover:scale-105"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="truncate max-w-[120px]">{w.component.title}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
};

