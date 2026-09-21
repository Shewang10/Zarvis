import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CoreState,
  FloatingWindow,
  DynamicUIComponent,
  JarvisEvent,
  ConversationItem,
  SystemStatusData,
} from './types';
import { api } from './services/api';
import { JarvisSpeechEngine, soundEffects } from './services/speech';
import { AICore } from './components/AICore';
import { FloatingWindowManager } from './components/FloatingWindowManager';
import { ActivityStream } from './components/ActivityStream';
import { ConversationHistory } from './components/ConversationHistory';
import { CommandBar } from './components/CommandBar';
import { HUDHeader } from './components/HUDHeader';
import { SettingsModal } from './components/SettingsModal';

export const App: React.FC = () => {
  // Application State
  const [coreState, setCoreState] = useState<CoreState>('IDLE');
  const [activeUtterance, setActiveUtterance] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isWakeWordMonitoring, setIsWakeWordMonitoring] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [demoMode, setDemoMode] = useState<boolean>(false);
  const [statusData, setStatusData] = useState<SystemStatusData | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Floating Windows
  const [windows, setWindows] = useState<FloatingWindow[]>([]);
  const nextZIndex = useRef<number>(10);

  // Telemetry & Conversation
  const [events, setEvents] = useState<JarvisEvent[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);

  // Speech Settings
  const [voiceRate, setVoiceRate] = useState<number>(1.05);
  const [voicePitch, setVoicePitch] = useState<number>(0.95);
  const [soundVolume, setSoundVolume] = useState<number>(0.6);

  // Speech Engine Ref & Command Ref
  const speechEngineRef = useRef<JarvisSpeechEngine | null>(null);
  const handleExecuteCommandRef = useRef<((cmd: string) => Promise<void>) | null>(null);
  const demoModeRef = useRef<boolean>(demoMode);
  demoModeRef.current = demoMode;

  // Add operational event helper
  const addEvent = useCallback((type: string, details: string, status: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const evt: JarvisEvent = {
      id: crypto.randomUUID(),
      type,
      status,
      details,
      timestamp: new Date().toISOString(),
    };
    setEvents((prev) => [...prev.slice(-35), evt]);
  }, []);

  // Window spawn helper - completely decoupled from state dependencies to prevent speech restarts
  const spawnWindow = useCallback((component: DynamicUIComponent) => {
    const id = component.id || crypto.randomUUID();
    nextZIndex.current += 1;

    // Intelligent positioning around AI Core
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    const initialWidth = Math.min(520, screenWidth - 40);
    const initialHeight = 440;

    setWindows((prev) => {
      const isEven = prev.length % 2 === 0;
      const x = isEven
        ? Math.max(20, Math.round(screenWidth * 0.5 - initialWidth - 80))
        : Math.min(screenWidth - initialWidth - 20, Math.round(screenWidth * 0.5 + 80));

      const y = Math.max(90, Math.round(screenHeight * 0.22 + (prev.length % 3) * 30));

      const newWindow: FloatingWindow = {
        id,
        component,
        x: isNaN(x) ? 60 : x,
        y: isNaN(y) ? 100 : y,
        width: initialWidth,
        height: initialHeight,
        isMinimized: false,
        isMaximized: false,
        zIndex: nextZIndex.current,
      };

      // Keep at most 4 windows open simultaneously to avoid clutter
      const filtered = prev.length >= 4 ? prev.slice(1) : prev;
      return [...filtered, newWindow];
    });
  }, []);

  // Execute Command Logic
  const handleExecuteCommand = useCallback(
    async (commandText: string) => {
      if (!commandText.trim()) return;

      setCoreState('PROCESSING');
      setActiveUtterance(commandText);
      addEvent('COMMAND_RECEIVED', `Initiating directive: "${commandText}"`, 'info');

      // State preview based on query
      const lower = commandText.toLowerCase();
      if (lower.includes('news') || lower.includes('search')) {
        setTimeout(() => setCoreState('SEARCHING'), 200);
      } else if (lower.includes('calculate') || lower.includes('weather')) {
        setTimeout(() => setCoreState('EXECUTING_TOOL'), 200);
      }

      try {
        const res = await api.sendCommand(commandText, undefined, demoModeRef.current);

        // Record backend telemetry events
        if (res.events && res.events.length > 0) {
          setEvents((prev) => [...prev.slice(-25), ...res.events]);
        }

        // Spawn dynamic holographic window
        spawnWindow(res.component);

        // Add to conversation log
        const convItem: ConversationItem = {
          id: res.conversationId,
          query: res.query,
          response: res.textResponse,
          spoken: res.spokenResponse,
          intent: res.intent,
          component: res.component,
          timestamp: res.timestamp,
        };
        setConversations((prev) => [convItem, ...prev.slice(0, 15)]);

        // Voice Response & Core Animation
        setCoreState('SPEAKING');
        soundEffects.playResponseChime();

        if (speechEngineRef.current) {
          speechEngineRef.current.speak(res.spokenResponse, () => {
            setCoreState('IDLE');
            setActiveUtterance('');
            addEvent('TRANSMISSION_COMPLETE', 'Audio briefing concluded', 'success');
          });
        } else {
          setTimeout(() => {
            setCoreState('IDLE');
            setActiveUtterance('');
          }, 3500);
        }
      } catch (err: any) {
        setCoreState('ERROR');
        soundEffects.playErrorTone();
        addEvent('SYSTEM_FAULT', err.message || 'Execution failed', 'error');

        // Provide vocal error notification with guaranteed return to IDLE
        if (speechEngineRef.current) {
          speechEngineRef.current.speak('Subsystem malfunction detected, sir. Please consult the log.', () => {
            setCoreState('IDLE');
            setActiveUtterance('');
          });
        } else {
          setTimeout(() => {
            setCoreState('IDLE');
            setActiveUtterance('');
          }, 2000);
        }
      }
    },
    [addEvent, spawnWindow]
  );

  handleExecuteCommandRef.current = handleExecuteCommand;

  // Initialize Speech Engine ONCE & System Status
  useEffect(() => {
    // 1. Fetch system status
    api
      .getStatus()
      .then((data) => {
        setStatusData(data);
        setDemoMode(data.demoMode);
        addEvent('SYSTEM_INITIALIZED', `JARVIS Online • Engine: ${data.aiProvider}`, 'success');
      })
      .catch(() => {
        addEvent('SYSTEM_INITIALIZED', 'JARVIS Online (Local Contingency Mode)', 'info');
      });

    // 2. Setup speech engine ONCE on component mount
    const engine = new JarvisSpeechEngine({
      onWakeWordDetected: () => {
        setCoreState('LISTENING');
        addEvent('WAKE_WORD_TRIGGER', 'Wake phrase detected', 'success');
      },
      onTranscriptChange: (interim) => {
        setActiveUtterance(interim);
      },
      onCommandComplete: (cmd) => {
        if (handleExecuteCommandRef.current) {
          handleExecuteCommandRef.current(cmd);
        }
      },
      onListeningStateChange: (listening, monitoring) => {
        setIsListening(listening);
        setIsWakeWordMonitoring(monitoring);
      },
      onError: (errMsg) => {
        addEvent('ACOUSTIC_SENSOR_ALERT', errMsg, 'warning');
      },
    });

    speechEngineRef.current = engine;

    // Start continuous wake-word loop if supported
    if (engine.isSupported) {
      engine.startWakeWordListening();
    } else {
      addEvent(
        'SPEECH_API_NOTICE',
        'Continuous speech API restricted in this browser. Spacebar & Push-to-Talk active.',
        'info'
      );
    }

    // Audio unlock listener for browser autoplay policy
    const unlockAudioOnGesture = () => {
      soundEffects.playWakeTone();
      window.removeEventListener('pointerdown', unlockAudioOnGesture);
      window.removeEventListener('keydown', unlockAudioOnGesture);
    };
    window.addEventListener('pointerdown', unlockAudioOnGesture);
    window.addEventListener('keydown', unlockAudioOnGesture);

    return () => {
      window.removeEventListener('pointerdown', unlockAudioOnGesture);
      window.removeEventListener('keydown', unlockAudioOnGesture);
      engine.stopListening();
      engine.stopSpeaking();
    };
  }, [addEvent]);

  // Global Keyboard Shortcut: Spacebar for Push-To-Talk
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is actively typing in an input
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        if (speechEngineRef.current) {
          speechEngineRef.current.triggerActiveListening();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Settings Handlers
  const handleChangeVoiceRate = (rate: number) => {
    setVoiceRate(rate);
    if (speechEngineRef.current) speechEngineRef.current.voiceRate = rate;
  };

  const handleChangeVoicePitch = (pitch: number) => {
    setVoicePitch(pitch);
    if (speechEngineRef.current) speechEngineRef.current.voicePitch = pitch;
  };

  const handleChangeSoundVolume = (vol: number) => {
    setSoundVolume(vol);
    soundEffects.volume = vol;
  };

  const handleTestVoice = () => {
    if (speechEngineRef.current) {
      soundEffects.playWakeTone();
      speechEngineRef.current.speak('Vocal modulation test. All tactical audio subsystems operational, sir.');
    }
  };

  const handleRefreshStatus = () => {
    api.getStatus().then((data) => {
      setStatusData(data);
      addEvent('TELEMETRY_REFRESH', 'Subsystem health refreshed', 'info');
    });
  };

  const handleToggleMic = () => {
    if (!speechEngineRef.current) return;
    if (isListening) {
      speechEngineRef.current.finalizeUserCommand();
    } else {
      speechEngineRef.current.triggerActiveListening();
    }
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundEffects.enabled = next;
  };

  const handleToggleDemoMode = () => {
    const next = !demoMode;
    setDemoMode(next);
    addEvent('MODE_CHANGE', `Operating mode switched to: ${next ? 'DEMO' : 'LIVE'}`, 'info');
  };

  // Window Management Actions
  const handleCloseWindow = (id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
  };

  const handleToggleMinimize = (id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMinimized: !w.isMinimized } : w))
    );
  };

  const handleToggleMaximize = (id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMaximized: !w.isMaximized } : w))
    );
  };

  const handleFocusWindow = (id: string) => {
    nextZIndex.current += 1;
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, zIndex: nextZIndex.current } : w))
    );
  };

  const handleReplayAudio = (text: string) => {
    if (speechEngineRef.current) {
      setCoreState('SPEAKING');
      speechEngineRef.current.speak(text, () => {
        setCoreState('IDLE');
      });
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-hud-bg text-hud-text overflow-hidden flex flex-col justify-between">
      {/* Scanline & Grid Effect */}
      <div className="scanlines" />

      {/* Top Header */}
      <HUDHeader
        statusData={statusData}
        demoMode={demoMode}
        onToggleDemoMode={handleToggleDemoMode}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Command Center Stage */}
      <main className="relative flex-1 flex items-center justify-center p-4 pt-20 pb-32">
        {/* Animated Holographic Core */}
        <AICore
          state={coreState}
          activeUtterance={activeUtterance}
          isWakeWordMonitoring={isWakeWordMonitoring}
          onCoreClick={handleToggleMic}
        />

        {/* Floating Holographic Response Windows */}
        <FloatingWindowManager
          windows={windows}
          onClose={handleCloseWindow}
          onToggleMinimize={handleToggleMinimize}
          onToggleMaximize={handleToggleMaximize}
          onFocus={handleFocusWindow}
        />

        {/* Live Operational Telemetry Feed (Right) */}
        <ActivityStream events={events} isExpandedDefault={true} />

        {/* Conversation History Drawer (Left) */}
        <ConversationHistory
          conversations={conversations}
          onReplayAudio={handleReplayAudio}
        />
      </main>

      {/* Bottom Command Bar */}
      <CommandBar
        coreState={coreState}
        isListening={isListening}
        isWakeWordMonitoring={isWakeWordMonitoring}
        soundEnabled={soundEnabled}
        demoMode={demoMode}
        onToggleMic={handleToggleMic}
        onToggleSound={handleToggleSound}
        onSubmitCommand={handleExecuteCommand}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        statusData={statusData}
        voiceRate={voiceRate}
        voicePitch={voicePitch}
        soundVolume={soundVolume}
        onChangeVoiceRate={handleChangeVoiceRate}
        onChangeVoicePitch={handleChangeVoicePitch}
        onChangeSoundVolume={handleChangeSoundVolume}
        onTestVoice={handleTestVoice}
        onRefreshStatus={handleRefreshStatus}
      />
    </div>
  );
};

