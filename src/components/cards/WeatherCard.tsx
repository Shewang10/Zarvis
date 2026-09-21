import React from 'react';
import { Cloud, Sun, CloudRain, Wind, Droplets, Compass } from 'lucide-react';

interface WeatherCardProps {
  data: {
    location: string;
    temperature: number;
    apparentTemperature: number;
    unit: string;
    condition: string;
    humidity: number;
    windSpeed: number;
    windUnit: string;
    forecast: Array<{
      day: string;
      tempMax: number;
      tempMin: number;
      condition: string;
    }>;
  };
}

export const WeatherCard: React.FC<WeatherCardProps> = ({ data }) => {
  const isRain = data.condition.toLowerCase().includes('rain') || data.condition.toLowerCase().includes('drizzle');
  const isCloud = data.condition.toLowerCase().includes('cloud') || data.condition.toLowerCase().includes('overcast');

  const WeatherIcon = isRain ? CloudRain : isCloud ? Cloud : Sun;

  return (
    <div className="p-4 space-y-4">
      {/* Current Atmospheric Readout */}
      <div className="flex items-center justify-between bg-hud-bg/70 border border-hud-cyan/30 rounded-xl p-4 shadow-glow-cyan">
        <div className="space-y-1">
          <div className="text-xs font-mono text-hud-muted flex items-center gap-1.5 uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5 text-hud-cyan" />
            {data.location}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-hud font-extrabold text-hud-cyan drop-shadow-[0_0_12px_rgba(0,240,255,0.4)]">
              {data.temperature}
            </span>
            <span className="text-xl font-hud text-hud-muted">{data.unit}</span>
          </div>
          <div className="text-sm font-sans font-medium text-hud-text">
            {data.condition} • Feels like {data.apparentTemperature}{data.unit}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center p-3 bg-hud-cyan/10 border border-hud-cyan/20 rounded-xl">
          <WeatherIcon className="w-12 h-12 text-hud-cyan animate-pulse-slow" />
        </div>
      </div>

      {/* Atmospheric Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-3 p-3 bg-hud-bg/50 border border-hud-cyan/20 rounded-lg">
          <Droplets className="w-5 h-5 text-hud-blue" />
          <div>
            <div className="text-[11px] font-mono text-hud-muted">HUMIDITY</div>
            <div className="text-sm font-hud font-semibold text-hud-text">{data.humidity}%</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-hud-bg/50 border border-hud-cyan/20 rounded-lg">
          <Wind className="w-5 h-5 text-hud-cyan" />
          <div>
            <div className="text-[11px] font-mono text-hud-muted">WIND VELOCITY</div>
            <div className="text-sm font-hud font-semibold text-hud-text">
              {data.windSpeed} {data.windUnit}
            </div>
          </div>
        </div>
      </div>

      {/* 5-Day Horizon Forecast */}
      {data.forecast && data.forecast.length > 0 && (
        <div className="space-y-2">
          <div className="text-[11px] font-mono text-hud-muted uppercase tracking-wider">
            5-Day Horizon Projection
          </div>
          <div className="grid grid-cols-5 gap-1.5 text-center">
            {data.forecast.map((fc, i) => (
              <div
                key={i}
                className="p-2 bg-hud-bg/60 border border-hud-cyan/15 hover:border-hud-cyan/40 rounded-lg transition-colors"
              >
                <div className="text-[11px] font-mono text-hud-cyan font-bold">{fc.day}</div>
                <div className="my-1.5 text-xs">
                  {fc.condition.includes('Rain') ? (
                    <CloudRain className="w-4 h-4 mx-auto text-hud-blue" />
                  ) : fc.condition.includes('Cloud') ? (
                    <Cloud className="w-4 h-4 mx-auto text-hud-muted" />
                  ) : (
                    <Sun className="w-4 h-4 mx-auto text-hud-gold" />
                  )}
                </div>
                <div className="text-xs font-hud font-semibold text-hud-text">
                  {fc.tempMax}°
                </div>
                <div className="text-[10px] font-mono text-hud-muted">
                  {fc.tempMin}°
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

