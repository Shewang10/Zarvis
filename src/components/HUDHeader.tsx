import React, { useState, useEffect } from 'react';
import { Radio, Settings, Sparkles, Terminal } from 'lucide-react';
import { SystemStatusData } from '../types';

interface HUDHeaderProps {
  statusData: SystemStatusData | null;
  demoMode: boolean;
  onToggleDemoMode: () => void;
  onOpenSettings: () => void;
}

export const HUDHeader: React.FC<HUDHeaderProps> = ({
  statusData,
  demoMode,
  onToggleDemoMode,
  onOpenSettings,
}) => {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="fixed top-0 inset-x-0 z-30 h-16 bg-gradient-to-b from-hud-bg via-hud-bg/90 to-transparent border-b border-hud-cyan/20 backdrop-blur-md px-4 flex items-center justify-between pointer-events-auto">
      {/* Brand & Arc Reactor */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-8 h-8 rounded-full border border-hud-cyan shadow-glow-cyan">
          <div className="w-3 h-3 rounded-full bg-hud-cyan animate-pulse" />
          <div className="absolute inset-0 rounded-full border border-dashed border-hud-cyan/50 animate-spin-slow" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="font-hud font-black text-sm md:text-base tracking-widest text-hud-text drop-shadow-[0_0_10px_rgba(0,240,255,0.7)]">
              J.A.R.V.I.S.
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-hud-cyan/15 text-hud-cyan border border-hud-cyan/30 uppercase tracking-widest hidden sm:inline">
              COMMAND CENTER v1.0
            </span>
          </div>
          <div className="text-[10px] font-mono text-hud-muted tracking-wider hidden sm:block">
            STARK TACTICAL AI ORCHESTRATION PROTOCOL
          </div>
        </div>
      </div>

      {/* Center Status Telemetry */}
      <div className="hidden lg:flex items-center gap-6 font-mono text-xs text-hud-muted">
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-hud-green animate-pulse" />
          <span>LINK:</span>
          <span className="text-hud-green font-bold">ONLINE</span>
        </div>

        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-hud-cyan" />
          <span>CORE:</span>
          <span className="text-hud-text truncate max-w-[160px]">
            {statusData?.aiProvider || 'Neural Engine'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span>TIME:</span>
          <span className="text-hud-cyan font-bold">{time}</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Demo Mode Toggle */}
        <button
          onClick={onToggleDemoMode}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border transition-all ${
            demoMode
              ? 'bg-hud-amber/15 border-hud-amber/50 text-hud-amber shadow-[0_0_10px_rgba(255,153,0,0.3)]'
              : 'bg-hud-cyan/10 border-hud-cyan/30 text-hud-cyan hover:bg-hud-cyan/20'
          }`}
          title="Toggle Deterministic Demo Mode vs Live Web Subsystems"
        >
          <Sparkles className="w-3 h-3" />
          <span className="font-bold">{demoMode ? 'DEMO MODE: ON' : 'LIVE MODE'}</span>
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl bg-hud-panel border border-hud-cyan/30 hover:border-hud-cyan text-hud-muted hover:text-hud-cyan shadow-glow-cyan transition-all"
          title="Tactical System Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
