// Web Speech & Web Audio Sound Engine for JARVIS

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  public volume: number = 0.6;

  private getContext(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Wake word activation tone
  playWakeTone() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1174.66, now); // D6
    osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.15);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.3 * this.volume, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.3);
    osc2.stop(now + 0.3);
  }

  // Tactical HUD beep
  playCommandAck() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1046.5, now); // C6
    osc.frequency.setValueAtTime(1318.5, now + 0.06); // E6

    gain.gain.setValueAtTime(0.15 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  // Holographic response ready chime
  playResponseChime() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [659.25, 830.61, 987.77, 1318.51].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noteTime = now + i * 0.04;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.18 * this.volume, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.26);
    });
  }

  // Error alert tone
  playErrorTone() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.setValueAtTime(220, now + 0.12);

    gain.gain.setValueAtTime(0.2 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }
}

export const soundEffects = new SoundSynthesizer();

export interface SpeechListenerHandlers {
  onWakeWordDetected: () => void;
  onTranscriptChange: (interim: string, isFinal: boolean) => void;
  onCommandComplete: (command: string) => void;
  onListeningStateChange: (isListening: boolean, isWakeWordMonitoring: boolean) => void;
  onError: (error: string) => void;
}

export class JarvisSpeechEngine {
  private recognition: any = null;
  private isContinuousEnabled = false;
  private isCurrentlySpeaking = false;
  private isUserTurnActive = false;
  private handlers: SpeechListenerHandlers;
  private synth: SpeechSynthesis | null = null;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private hindiVoice: SpeechSynthesisVoice | null = null;
  private silenceTimer: any = null;
  private currentUtterance: string = '';

  public isSupported = false;
  public voiceRate = 1.05;
  public voicePitch = 0.95;

  constructor(handlers: SpeechListenerHandlers) {
    this.handlers = handlers;

    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        this.isSupported = true;
        this.recognition = new SpeechRecognition();
        this.setupRecognition();
      }

      if ('speechSynthesis' in window) {
        this.synth = window.speechSynthesis;
        this.initVoice();
      }
    }
  }

  private initVoice() {
    if (!this.synth) return;
    const pickVoice = () => {
      const voices = this.synth?.getVoices() || [];
      // Prefer British or sophisticated male English voices (like Paul Bettany's JARVIS)
      const preferred = voices.find(
        (v) =>
          (v.lang.startsWith('en-GB') || v.lang.startsWith('en')) &&
          (v.name.includes('Daniel') ||
            v.name.includes('Oliver') ||
            v.name.includes('Arthur') ||
            v.name.includes('George') ||
            v.name.includes('Google UK English Male') ||
            v.name.includes('Natural'))
      ) || voices.find((v) => v.lang.startsWith('en-GB')) || voices.find((v) => v.lang.startsWith('en'));

      if (preferred) {
        this.selectedVoice = preferred;
      }

      // Find Hindi voice for bilingual replies
      const hi = voices.find(
        (v) =>
          v.lang.startsWith('hi') ||
          v.name.toLowerCase().includes('hindi') ||
          v.name.includes('हिन्दी') ||
          v.name.toLowerCase().includes('lekha') ||
          v.name.toLowerCase().includes('neerja')
      ) || voices.find((v) => v.lang.includes('IN'));

      if (hi) {
        this.hindiVoice = hi;
      }
    };

    pickVoice();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = pickVoice;
    }
  }

  private setupRecognition() {
    if (!this.recognition) return;

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.handlers.onListeningStateChange(this.isUserTurnActive, this.isContinuousEnabled && !this.isUserTurnActive);
    };

    this.recognition.onresult = (event: any) => {
      // Prevent hearing JARVIS's own speech
      if (this.isCurrentlySpeaking) return;

      let interim = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interim += transcript;
        }
      }

      const activeText = (finalTranscript || interim).trim();
      const lower = activeText.toLowerCase();

      // Check for wake word trigger in English and Hindi
      const wakeWordMatch = lower.match(
        /\b(?:hey\s+jarvis|jarvis|zarvis|ok\s+jarvis|hey\s+zarvis|नमस्ते\s*जार्विस|जार्विस|namaste\s*jarvis)\b/i
      );

      if (!this.isUserTurnActive && wakeWordMatch) {
        this.isUserTurnActive = true;
        soundEffects.playWakeTone();
        this.handlers.onWakeWordDetected();

        // Strip the wake word prefix from initial command
        const afterWake = activeText.slice(wakeWordMatch.index! + wakeWordMatch[0].length).replace(/^[,.\s]+/, '');
        this.currentUtterance = afterWake;
        this.handlers.onTranscriptChange(afterWake, false);
        this.resetSilenceTimer();
        return;
      }

      if (this.isUserTurnActive) {
        this.currentUtterance = activeText;
        this.handlers.onTranscriptChange(activeText, Boolean(finalTranscript));
        this.resetSilenceTimer();
      }
    };

    this.recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') {
        // Normal silence timeout in speech recognition
        return;
      }
      if (event.error === 'not-allowed') {
        this.handlers.onError('Microphone access blocked. Please permit microphone access in browser settings.');
        this.isContinuousEnabled = false;
        this.handlers.onListeningStateChange(false, false);
      }
    };

    this.recognition.onend = () => {
      if (this.isContinuousEnabled && !this.isCurrentlySpeaking) {
        // Auto-restart continuous listening loop
        try {
          this.recognition.start();
        } catch {
          // Handled on next cycle
        }
      } else {
        this.handlers.onListeningStateChange(false, false);
      }
    };
  }

  private resetSilenceTimer() {
    if (this.silenceTimer) clearTimeout(this.silenceTimer);

    // If user pauses for 1.8 seconds after speaking a command, submit it automatically
    this.silenceTimer = setTimeout(() => {
      if (this.isUserTurnActive && this.currentUtterance.trim().length > 0) {
        this.finalizeUserCommand();
      }
    }, 1800);
  }

  public finalizeUserCommand() {
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
    const command = this.currentUtterance.trim();
    this.currentUtterance = '';
    this.isUserTurnActive = false;

    if (command) {
      soundEffects.playCommandAck();
      this.handlers.onCommandComplete(command);
    }
  }

  // Start continuous wake-word monitoring
  public startWakeWordListening() {
    if (!this.isSupported || !this.recognition) return;
    this.isContinuousEnabled = true;
    this.isUserTurnActive = false;

    try {
      this.recognition.start();
    } catch {
      // Already running or starting
    }
  }

  // Force active listening immediately (push-to-talk or Spacebar)
  public triggerActiveListening() {
    if (!this.isSupported || !this.recognition) return;

    if (this.synth) this.synth.cancel();
    this.isCurrentlySpeaking = false;
    this.isUserTurnActive = true;
    this.currentUtterance = '';

    soundEffects.playWakeTone();
    this.handlers.onWakeWordDetected();

    try {
      this.recognition.start();
    } catch {
      // Recognition is already active
    }
    this.handlers.onListeningStateChange(true, false);
  }

  public stopListening() {
    this.isContinuousEnabled = false;
    this.isUserTurnActive = false;
    if (this.silenceTimer) clearTimeout(this.silenceTimer);

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore
      }
    }
    this.handlers.onListeningStateChange(false, false);
  }

  // Text-to-speech with natural voice and echo cancellation
  public speak(text: string, onEnd?: () => void) {
    if (!this.synth) {
      if (onEnd) onEnd();
      return;
    }

    this.synth.cancel();
    this.isCurrentlySpeaking = true;

    // Temporarily pause recognition so JARVIS does not listen to itself
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore
      }
    }

    const cleanText = text
      .replace(/https?:\/\/[^\s]+/g, '')
      .replace(/[*_#`~[\]]/g, '')
      .trim();

    const isHindi = /[\u0900-\u097F]/.test(cleanText);

    const utterance = new SpeechSynthesisUtterance(cleanText);
    if (isHindi && this.hindiVoice) {
      utterance.voice = this.hindiVoice;
      utterance.lang = 'hi-IN';
      utterance.rate = 1.0;
    } else if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
      utterance.rate = this.voiceRate;
    }
    utterance.pitch = this.voicePitch;

    utterance.onend = () => {
      this.isCurrentlySpeaking = false;
      if (onEnd) onEnd();

      // Resume continuous wake-word loop after speech finishes
      if (this.isContinuousEnabled && this.recognition) {
        setTimeout(() => {
          try {
            this.recognition.start();
          } catch {
            // Ignore
          }
        }, 300);
      }
    };

    utterance.onerror = () => {
      this.isCurrentlySpeaking = false;
      if (onEnd) onEnd();
      if (this.isContinuousEnabled && this.recognition) {
        try {
          this.recognition.start();
        } catch {
          // Ignore
        }
      }
    };

    this.synth.speak(utterance);
  }

  public stopSpeaking() {
    if (this.synth) {
      this.synth.cancel();
    }
    this.isCurrentlySpeaking = false;
  }
}

