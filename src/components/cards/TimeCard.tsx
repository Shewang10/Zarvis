import React from 'react';
import { Clock, Globe, Compass } from 'lucide-react';

interface TimeCardProps {
  data: {
    formattedTime: string;
    formattedDate: string;
    dayOfWeek: string;
    timezone: string;
    utcOffset: string;
    worldClocks?: Array<{
      city: string;
      time: string;
      diff: string;
    }>;
  };
}

export const TimeCard: React.FC<TimeCardProps> = ({ data }) => {
  return (
    <div className="p-4 space-y-4">
      {/* Primary Digital Chronometer */}
      <div className="p-4 bg-black/60 border border-hud-cyan/40 rounded-xl text-center shadow-glow-cyan">
        <div className="text-xs font-mono text-hud-muted flex items-center justify-center gap-1.5 uppercase tracking-widest mb-1">
          <Clock className="w-3.5 h-3.5 text-hud-cyan animate-spin-slow" />
          TEMPORAL COORDINATES
        </div>

        <div className="text-4xl md:text-5xl font-hud font-extrabold text-hud-cyan drop-shadow-[0_0_15px_rgba(0,240,255,0.7)] my-2">
          {data.formattedTime}
        </div>

        <div className="text-sm font-sans font-medium text-hud-text">
          {data.dayOfWeek}, {data.formattedDate}
        </div>

        <div className="mt-2 inline-flex items-center gap-2 text-xs font-mono px-2.5 py-1 rounded bg-hud-cyan/10 border border-hud-cyan/30 text-hud-muted">
          <Compass className="w-3 h-3 text-hud-cyan" />
          <span>{data.timezone}</span>
          <span className="text-hud-cyan">({data.utcOffset})</span>
        </div>
      </div>

      {/* World Clock Horizons */}
      {data.worldClocks && data.worldClocks.length > 0 && (
        <div className="space-y-2">
          <div className="text-[11px] font-mono text-hud-muted uppercase tracking-wider flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-hud-cyan" />
            Global Tactical Timezones
          </div>

          <div className="grid grid-cols-2 gap-2">
            {data.worldClocks.map((wc, i) => (
              <div
                key={i}
                className="p-2.5 bg-hud-bg/50 border border-hud-cyan/20 hover:border-hud-cyan/50 rounded-lg transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-mono text-hud-text font-bold">{wc.city}</div>
                  <div className="text-[10px] font-mono text-hud-muted">{wc.diff}</div>
                </div>
                <div className="text-sm font-hud font-semibold text-hud-cyan">
                  {wc.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

