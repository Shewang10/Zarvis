import React from 'react';
import { X, Volume2, Mic, Sliders, Key, Database, RefreshCw } from 'lucide-react';
import { SystemStatusData } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  statusData: SystemStatusData | null;
  voiceRate: number;
  voicePitch: number;
  soundVolume: number;
  onChangeVoiceRate: (rate: number) => void;
  onChangeVoicePitch: (pitch: number) => void;
  onChangeSoundVolume: (volume: number) => void;
  onTestVoice: () => void;
  onRefreshStatus: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  statusData,
  voiceRate,
  voicePitch,
  soundVolume,
  onChangeVoiceRate,
  onChangeVoicePitch,
  onChangeSoundVolume,
  onTestVoice,
  onRefreshStatus,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md pointer-events-auto">
      <div className="bg-hud-panel border border-hud-cyan/50 rounded-2xl shadow-glow-cyan max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-black/60 border-b border-hud-cyan/30">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-hud-cyan" />
            <span className="font-hud font-bold text-sm tracking-wider text-hud-cyan">
              TACTICAL SYSTEM CONFIGURATION
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-hud-muted hover:text-hud-red hover:bg-hud-red/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto custom-scrollbar font-mono text-xs">
          {/* Audio & Speech Synthesizer Controls */}
          <div className="space-y-3 bg-black/40 border border-hud-cyan/20 p-4 rounded-xl">
            <div className="flex items-center justify-between text-hud-cyan font-bold">
              <span className="flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                VOCAL SYNTHESIS & ACOUSTICS
              </span>
              <button
                onClick={onTestVoice}
                className="px-2.5 py-1 rounded bg-hud-cyan/20 text-hud-cyan border border-hud-cyan/40 hover:bg-hud-cyan hover:text-black transition-all text-[11px]"
              >
                TEST SYNTHESIS
              </button>
            </div>

            {/* Vocal Rate */}
            <div className="space-y-1">
              <div className="flex justify-between text-hud-muted">
                <span>Vocal Speed Rate</span>
                <span className="text-hud-text">{voiceRate.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.75"
                max="1.35"
                step="0.05"
                value={voiceRate}
                onChange={(e) => onChangeVoiceRate(parseFloat(e.target.value))}
                className="w-full accent-hud-cyan cursor-pointer"
              />
            </div>

            {/* Vocal Pitch */}
            <div className="space-y-1">
              <div className="flex justify-between text-hud-muted">
                <span>Vocal Pitch Tone</span>
                <span className="text-hud-text">{voicePitch.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.3"
                step="0.05"
                value={voicePitch}
                onChange={(e) => onChangeVoicePitch(parseFloat(e.target.value))}
                className="w-full accent-hud-cyan cursor-pointer"
              />
            </div>

            {/* HUD Audio Volume */}
            <div className="space-y-1">
              <div className="flex justify-between text-hud-muted">
                <span>HUD Sound FX Volume</span>
                <span className="text-hud-text">{Math.round(soundVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={soundVolume}
                onChange={(e) => onChangeSoundVolume(parseFloat(e.target.value))}
                className="w-full accent-hud-cyan cursor-pointer"
              />
            </div>
          </div>

          {/* Connected Providers & Secrets Status */}
          <div className="space-y-3 bg-black/40 border border-hud-cyan/20 p-4 rounded-xl">
            <div className="flex items-center justify-between text-hud-cyan font-bold">
              <span className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                SUBSYSTEM KEYS & ENCLAVES
              </span>
              <button
                onClick={onRefreshStatus}
                className="text-hud-muted hover:text-hud-cyan p-1"
                title="Refresh Subsystem Health"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded bg-hud-bg/70 border border-hud-cyan/15">
                <span className="text-hud-text">Google Gemini API:</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    statusData?.hasGeminiKey
                      ? 'bg-hud-green/20 text-hud-green border border-hud-green/40'
                      : 'bg-hud-muted/20 text-hud-muted'
                  }`}
                >
                  {statusData?.hasGeminiKey ? 'CONFIGURED & ACTIVE' : 'UNSET (FALLBACK ACTIVE)'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-hud-bg/70 border border-hud-cyan/15">
                <span className="text-hud-text">OpenAI GPT-4o API:</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    statusData?.hasOpenAIKey
                      ? 'bg-hud-green/20 text-hud-green border border-hud-green/40'
                      : 'bg-hud-muted/20 text-hud-muted'
                  }`}
                >
                  {statusData?.hasOpenAIKey ? 'CONFIGURED & ACTIVE' : 'UNSET (FALLBACK ACTIVE)'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-hud-bg/70 border border-hud-cyan/15">
                <span className="text-hud-text">Active AI Engine:</span>
                <span className="text-hud-cyan font-bold">{statusData?.aiProvider}</span>
              </div>
            </div>
          </div>

          {/* Persistent Database Diagnostics */}
          <div className="space-y-2 bg-black/40 border border-hud-cyan/20 p-4 rounded-xl">
            <div className="flex items-center gap-2 text-hud-cyan font-bold">
              <Database className="w-4 h-4" />
              PERSISTENT STORAGE DIAGNOSTIC
            </div>
            <div className="text-hud-text/80 text-[11px] leading-relaxed">
              Engine: <span className="text-hud-cyan">SQLite 3 / Cloudflare D1 Sync Layer</span>
            </div>
            <div className="text-hud-muted text-[10px]">
              Schema tables: memories, conversations, events, tool_executions.
            </div>
          </div>

          {/* Hands-Free Wake Word Instructions */}
          <div className="p-3.5 bg-hud-cyan/5 border border-hud-cyan/30 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 text-hud-cyan font-bold text-[11px]">
              <Mic className="w-3.5 h-3.5" />
              HANDS-FREE WAKE WORD GUIDE
            </div>
            <p className="text-hud-text/75 text-[11px] leading-relaxed">
              When microphone permission is granted, JARVIS operates in continuous wake-word mode. Simply say <strong className="text-hud-cyan">"Hey Jarvis"</strong> or <strong className="text-hud-cyan">"Jarvis"</strong> followed by your directive. You can also tap the Spacebar or microphone button at any time.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-black/60 border-t border-hud-cyan/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-hud-cyan hover:bg-hud-cyan/80 text-black font-hud font-bold text-xs shadow-glow-cyan transition-all"
          >
            CONFIRM & CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};

