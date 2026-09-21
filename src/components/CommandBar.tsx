import React, { useState } from 'react';
import { Mic, MicOff, Send, Volume2, VolumeX, Sparkles, Keyboard } from 'lucide-react';
import { CoreState } from '../types';

interface CommandBarProps {
  coreState: CoreState;
  isListening: boolean;
  isWakeWordMonitoring: boolean;
  soundEnabled: boolean;
  demoMode: boolean;
  onToggleMic: () => void;
  onToggleSound: () => void;
  onSubmitCommand: (text: string) => void;
}

const QUICK_COMMANDS = [
  'What are the latest AI news today?',
  'Search the web for NVIDIA AI announcements',
  'Remember that my project is called CleanFleet',
  'What do you remember about CleanFleet?',
  'Calculate 125 multiplied by 47',
  "Show me today's weather",
  'What time is it?',
  'Show me the last five things I asked you',
  'System status diagnostic',
];

export const CommandBar: React.FC<CommandBarProps> = ({
  coreState,
  isListening,
  isWakeWordMonitoring,
  soundEnabled,
  demoMode,
  onToggleMic,
  onToggleSound,
  onSubmitCommand,
}) => {
  const [inputText, setInputText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSubmitCommand(inputText.trim());
    setInputText('');
  };

  const handleQuickCommand = (cmd: string) => {
    onSubmitCommand(cmd);
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 p-3 bg-gradient-to-t from-hud-bg via-hud-bg/95 to-transparent pointer-events-auto">
      <div className="max-w-4xl mx-auto space-y-2">
        {/* Quick Suggestion Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-[11px] font-mono">
          <span className="text-hud-muted flex items-center gap-1 shrink-0 px-1">
            <Sparkles className="w-3 h-3 text-hud-cyan" />
            DIRECTIVES:
          </span>
          {QUICK_COMMANDS.map((cmd, i) => (
            <button
              key={i}
              onClick={() => handleQuickCommand(cmd)}
              className="shrink-0 px-2.5 py-1 rounded-full bg-hud-panel border border-hud-cyan/20 hover:border-hud-cyan text-hud-text/80 hover:text-hud-cyan backdrop-blur-md transition-all hover:scale-105 active:scale-95"
            >
              {cmd}
            </button>
          ))}
        </div>

        {/* Command Console Bar */}
        <div className="flex items-center gap-2 bg-hud-panel border border-hud-cyan/40 rounded-2xl p-2 shadow-glow-cyan backdrop-blur-xl">
          {/* Push-To-Talk Microphone Trigger */}
          <button
            onClick={onToggleMic}
            className={`relative p-3 rounded-xl transition-all duration-300 flex items-center justify-center ${
              isListening
                ? 'bg-hud-gold text-black shadow-glow-gold scale-105 animate-pulse'
                : isWakeWordMonitoring
                ? 'bg-hud-cyan/20 text-hud-cyan border border-hud-cyan/50 hover:bg-hud-cyan hover:text-black hover:shadow-glow-cyan'
                : 'bg-black/40 text-hud-muted border border-hud-cyan/20 hover:text-hud-cyan'
            }`}
            title={isListening ? 'Listening active' : 'Click or press Spacebar to activate microphone'}
          >
            {isListening ? (
              <Mic className="w-5 h-5 animate-bounce" />
            ) : isWakeWordMonitoring ? (
              <Mic className="w-5 h-5" />
            ) : (
              <MicOff className="w-5 h-5" />
            )}

            {/* Ripple when active */}
            {isListening && (
              <span className="absolute inset-0 rounded-xl border-2 border-hud-gold animate-ping opacity-75" />
            )}
          </button>

          {/* Wake Word Status Tag */}
          <div className="hidden sm:flex flex-col justify-center px-2 font-mono text-[10px] leading-tight select-none">
            <div className="flex items-center gap-1.5 font-bold">
              <span
                className={`w-2 h-2 rounded-full ${
                  isListening
                    ? 'bg-hud-gold animate-ping'
                    : isWakeWordMonitoring
                    ? 'bg-hud-green animate-pulse'
                    : 'bg-hud-muted'
                }`}
              />
              <span className={isListening ? 'text-hud-gold' : isWakeWordMonitoring ? 'text-hud-green' : 'text-hud-muted'}>
                {isListening
                  ? 'ACTIVE RECORDING'
                  : isWakeWordMonitoring
                  ? 'WAKE WORD: "HEY JARVIS"'
                  : 'MIC STANDBY'}
              </span>
            </div>
            <div className="text-hud-muted flex items-center gap-1 mt-0.5">
              <Keyboard className="w-2.5 h-2.5" />
              <span>SPACEBAR TO TALK</span>
            </div>
          </div>

          {/* Text Input Fallback */}
          <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder='Direct directive... (e.g. "What are the latest AI news today?")'
                className={`w-full bg-black/40 rounded-xl px-3.5 py-2 text-xs md:text-sm text-hud-text placeholder-hud-muted font-mono outline-none transition-all ${
                  coreState === 'ERROR'
                    ? 'border border-hud-red shadow-glow-red'
                    : coreState === 'LISTENING'
                    ? 'border border-hud-gold shadow-glow-gold'
                    : 'border border-hud-cyan/20 focus:border-hud-cyan focus:shadow-glow-cyan'
                }`}
              />
              {demoMode && (
                <span className="absolute right-3 top-2.5 text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-hud-amber/20 text-hud-amber border border-hud-amber/30 pointer-events-none hidden md:inline">
                  DEMO ACTIVE
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 rounded-xl bg-hud-cyan/20 hover:bg-hud-cyan text-hud-cyan hover:text-black border border-hud-cyan/30 disabled:opacity-30 disabled:hover:bg-hud-cyan/20 disabled:hover:text-hud-cyan transition-all"
              title="Execute directive"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Sound Synthesizer Toggle */}
          <button
            onClick={onToggleSound}
            className={`p-2.5 rounded-xl border transition-all ${
              soundEnabled
                ? 'bg-hud-cyan/10 border-hud-cyan/30 text-hud-cyan hover:bg-hud-cyan/20'
                : 'bg-black/30 border-hud-muted/20 text-hud-muted hover:text-hud-text'
            }`}
            title={soundEnabled ? 'HUD Audio Synthesizer ON' : 'HUD Audio Muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
