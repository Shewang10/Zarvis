import React, { useEffect, useRef } from 'react';
import { CoreState } from '../types';

interface AICoreProps {
  state: CoreState;
  activeUtterance?: string;
  isWakeWordMonitoring?: boolean;
  onCoreClick?: () => void;
}

export const AICore: React.FC<AICoreProps> = ({
  state,
  activeUtterance = '',
  isWakeWordMonitoring = true,
  onCoreClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let angle = 0;
    let pulse = 0;

    // High DPI Canvas resolution
    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    // Particle nodes for ambient hologram field
    const particles: Array<{
      x: number;
      y: number;
      radius: number;
      speed: number;
      angle: number;
      distance: number;
    }> = [];

    for (let i = 0; i < 40; i++) {
      particles.push({
        x: 0,
        y: 0,
        radius: Math.random() * 1.5 + 0.5,
        speed: (Math.random() * 0.01 + 0.005) * (i % 2 === 0 ? 1 : -1),
        angle: Math.random() * Math.PI * 2,
        distance: Math.random() * 95 + 40,
      });
    }

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const cx = width / 2;
      const cy = height / 2;

      ctx.clearRect(0, 0, width, height);

      // State speeds and colors
      let ringSpeed = 0.015;
      let primaryColor = '#00f0ff';
      let secondaryColor = 'rgba(0, 240, 255, 0.2)';
      let glowColor = 'rgba(0, 240, 255, 0.5)';

      if (state === 'LISTENING') {
        ringSpeed = 0.035;
        primaryColor = '#ffd000';
        secondaryColor = 'rgba(255, 208, 0, 0.25)';
        glowColor = 'rgba(255, 208, 0, 0.7)';
      } else if (state === 'PROCESSING') {
        ringSpeed = 0.06;
        primaryColor = '#a855f7';
        secondaryColor = 'rgba(168, 85, 247, 0.25)';
        glowColor = 'rgba(168, 85, 247, 0.6)';
      } else if (state === 'SEARCHING') {
        ringSpeed = 0.08;
        primaryColor = '#0088ff';
        secondaryColor = 'rgba(0, 136, 255, 0.3)';
        glowColor = 'rgba(0, 136, 255, 0.8)';
      } else if (state === 'EXECUTING_TOOL') {
        ringSpeed = 0.045;
        primaryColor = '#ff9900';
        secondaryColor = 'rgba(255, 153, 0, 0.25)';
        glowColor = 'rgba(255, 153, 0, 0.7)';
      } else if (state === 'SPEAKING') {
        ringSpeed = 0.025;
        primaryColor = '#00ff88';
        secondaryColor = 'rgba(0, 255, 136, 0.25)';
        glowColor = 'rgba(0, 255, 136, 0.8)';
      } else if (state === 'ERROR') {
        ringSpeed = 0.01;
        primaryColor = '#ff3366';
        secondaryColor = 'rgba(255, 51, 102, 0.25)';
        glowColor = 'rgba(255, 51, 102, 0.8)';
      }

      angle += ringSpeed;
      pulse += 0.04;
      const breathing = Math.sin(pulse) * 4;

      // 1. Ambient Background Grid Glow
      const bgGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 160);
      bgGrad.addColorStop(0, glowColor);
      bgGrad.addColorStop(0.5, secondaryColor);
      bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 150, 0, Math.PI * 2);
      ctx.fill();

      // 2. Hologram Orbiting Particles
      particles.forEach((p) => {
        p.angle += p.speed;
        const px = cx + Math.cos(p.angle) * (p.distance + (state === 'LISTENING' ? breathing * 2 : 0));
        const py = cy + Math.sin(p.angle) * (p.distance + (state === 'LISTENING' ? breathing * 2 : 0));
        ctx.fillStyle = primaryColor;
        ctx.beginPath();
        ctx.arc(px, py, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Outermost Thin Tech Ring
      ctx.save();
      ctx.strokeStyle = secondaryColor;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 8]);
      ctx.beginPath();
      ctx.arc(cx, cy, 135, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 4. Segmented Arc Ring (Clockwise)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 12;
      ctx.shadowColor = glowColor;

      // Draw 3 HUD Arcs
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        const start = (i * Math.PI * 2) / 3 + 0.2;
        const end = start + (Math.PI * 2) / 3 - 0.4;
        ctx.arc(0, 0, 115 + breathing, start, end);
        ctx.stroke();
      }
      ctx.restore();

      // 5. Counter-rotating Segmented Ring with Tick Marks
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-angle * 1.4);
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 8;
      ctx.shadowColor = glowColor;

      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        const start = (i * Math.PI * 2) / 4;
        const end = start + 0.6;
        ctx.arc(0, 0, 92 - breathing * 0.5, start, end);
        ctx.stroke();
      }

      // 12 Fine Graduation Ticks
      ctx.lineWidth = 1;
      ctx.strokeStyle = secondaryColor;
      for (let i = 0; i < 16; i++) {
        const tickAngle = (i * Math.PI * 2) / 16;
        const r1 = 80;
        const r2 = i % 4 === 0 ? 86 : 83;
        ctx.beginPath();
        ctx.moveTo(Math.cos(tickAngle) * r1, Math.sin(tickAngle) * r1);
        ctx.lineTo(Math.cos(tickAngle) * r2, Math.sin(tickAngle) * r2);
        ctx.stroke();
      }
      ctx.restore();

      // 6. Audio Waveform Spikes (When SPEAKING or LISTENING)
      if (state === 'SPEAKING' || state === 'LISTENING') {
        const barCount = 36;
        ctx.save();
        ctx.translate(cx, cy);
        for (let i = 0; i < barCount; i++) {
          const a = (i * Math.PI * 2) / barCount;
          const amp = Math.abs(Math.sin(pulse * 3 + i * 0.5)) * (state === 'SPEAKING' ? 24 : 14) + 4;
          const rBase = 60;
          ctx.strokeStyle = primaryColor;
          ctx.lineWidth = 2;
          ctx.shadowBlur = 10;
          ctx.shadowColor = glowColor;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * rBase, Math.sin(a) * rBase);
          ctx.lineTo(Math.cos(a) * (rBase + amp), Math.sin(a) * (rBase + amp));
          ctx.stroke();
        }
        ctx.restore();
      }

      // 7. Core Luminous Orb
      const orbRadius = 46 + (state === 'LISTENING' || state === 'SPEAKING' ? Math.abs(breathing) * 1.5 : 0);
      const orbGrad = ctx.createRadialGradient(cx - 10, cy - 10, 2, cx, cy, orbRadius);
      orbGrad.addColorStop(0, '#ffffff');
      orbGrad.addColorStop(0.3, primaryColor);
      orbGrad.addColorStop(0.7, secondaryColor);
      orbGrad.addColorStop(1, 'rgba(0, 0, 0, 0.4)');

      ctx.save();
      ctx.fillStyle = orbGrad;
      ctx.shadowBlur = 25;
      ctx.shadowColor = glowColor;
      ctx.beginPath();
      ctx.arc(cx, cy, orbRadius, 0, Math.PI * 2);
      ctx.fill();

      // Inner Core Ring
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, orbRadius * 0.6, 0, Math.PI * 2);
      ctx.stroke();

      // Center Core Dot
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', updateSize);
    };
  }, [state]);

  const stateLabels: Record<CoreState, { label: string; sub: string; color: string }> = {
    IDLE: {
      label: 'JARVIS // ONLINE',
      sub: isWakeWordMonitoring ? 'Say "Hey Jarvis" to interact' : 'Ready for directive',
      color: 'text-hud-cyan',
    },
    LISTENING: {
      label: 'LISTENING...',
      sub: 'Awaiting your command',
      color: 'text-hud-gold',
    },
    PROCESSING: {
      label: 'PROCESSING INTENT',
      sub: 'Neural analysis active',
      color: 'text-purple-400',
    },
    SEARCHING: {
      label: 'SEARCHING WEB & SENSORS',
      sub: 'Querying external streams',
      color: 'text-blue-400',
    },
    EXECUTING_TOOL: {
      label: 'EXECUTING SUBSYSTEM',
      sub: 'Performing precision tool operation',
      color: 'text-hud-amber',
    },
    SPEAKING: {
      label: 'SYNTHESIZING AUDIO',
      sub: 'Transmitting vocal briefing',
      color: 'text-hud-green',
    },
    ERROR: {
      label: 'ALERT // ANOMALY',
      sub: 'Subsystem execution failed',
      color: 'text-hud-red',
    },
  };

  const currentInfo = stateLabels[state];

  return (
    <div className="relative flex flex-col items-center justify-center select-none pointer-events-auto">
      {/* Interactive Core Canvas Container */}
      <div
        onClick={onCoreClick}
        title="Click to toggle voice interaction or trigger listening"
        className="relative w-80 h-80 md:w-96 md:h-96 flex items-center justify-center cursor-pointer group transition-transform duration-300 active:scale-95"
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full absolute inset-0 z-10"
        />

        {/* Ambient Pulsing Halo */}
        <div
          className={`absolute w-44 h-44 rounded-full blur-2xl transition-all duration-700 pointer-events-none opacity-40 group-hover:opacity-70 ${
            state === 'LISTENING'
              ? 'bg-hud-gold shadow-glow-gold'
              : state === 'SPEAKING'
              ? 'bg-hud-green shadow-glow-green'
              : state === 'PROCESSING'
              ? 'bg-purple-600'
              : state === 'SEARCHING'
              ? 'bg-blue-600 shadow-glow-blue'
              : state === 'ERROR'
              ? 'bg-hud-red shadow-glow-red'
              : 'bg-hud-cyan shadow-glow-cyan'
          }`}
        />
      </div>

      {/* State & Transcription HUD Readout */}
      <div className="text-center z-20 -mt-4 flex flex-col items-center max-w-md px-4">
        <div
          className={`font-hud tracking-widest text-sm md:text-base font-bold uppercase transition-colors duration-300 ${currentInfo.color} drop-shadow-[0_0_8px_currentColor]`}
        >
          {currentInfo.label}
        </div>

        {/* Live speech transcription display */}
        {activeUtterance ? (
          <div className="mt-2 text-hud-text text-sm md:text-base font-mono bg-hud-panel/90 border border-hud-cyan/40 px-4 py-1.5 rounded-full backdrop-blur-md animate-pulse shadow-glow-cyan max-w-sm truncate">
            "{activeUtterance}"
          </div>
        ) : (
          <div className="text-hud-muted text-xs font-mono mt-1 tracking-wider uppercase">
            {currentInfo.sub}
          </div>
        )}
      </div>
    </div>
  );
};
