import { ToolDefinition } from '../types.js';

interface WeatherInput {
  location?: string;
}

interface WeatherOutput {
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
  source: 'open_meteo' | 'demo_data';
}

const WMO_CODES: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  80: 'Rain showers',
  95: 'Thunderstorm',
};

export const weatherTool: ToolDefinition<WeatherInput, WeatherOutput> = {
  name: 'weather',
  description: 'Retrieves current weather conditions, temperature, humidity, wind, and forecast for any city or location.',
  parameters: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: 'City or location name, e.g. "San Francisco", "Tokyo", "London", "New York"',
      },
    },
  },
  execute: async ({ location = 'Current Location' }, context) => {
    const loc = location.trim();

    if (!context.demoMode && loc && loc.toLowerCase() !== 'current location') {
      try {
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(loc)}&count=1&language=en&format=json`
        );
        if (geoRes.ok) {
          const geoData = (await geoRes.json()) as any;
          if (geoData.results && geoData.results.length > 0) {
            const place = geoData.results[0];
            const lat = place.latitude;
            const lon = place.longitude;
            const resolvedName = `${place.name}, ${place.country || place.admin1 || ''}`;

            const weatherRes = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`
            );

            if (weatherRes.ok) {
              const data = (await weatherRes.json()) as any;
              const current = data.current;
              const daily = data.daily;

              const forecast = (daily.time || []).slice(0, 5).map((t: string, idx: number) => {
                const date = new Date(t);
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                return {
                  day: idx === 0 ? 'Today' : dayName,
                  tempMax: Math.round(daily.temperature_2m_max[idx]),
                  tempMin: Math.round(daily.temperature_2m_min[idx]),
                  condition: WMO_CODES[daily.weather_code[idx]] || 'Clear',
                };
              });

              return {
                location: resolvedName,
                temperature: Math.round(current.temperature_2m),
                apparentTemperature: Math.round(current.apparent_temperature),
                unit: '°C',
                condition: WMO_CODES[current.weather_code] || 'Clear',
                humidity: current.relative_humidity_2m,
                windSpeed: Math.round(current.wind_speed_10m),
                windUnit: 'km/h',
                forecast,
                source: 'open_meteo',
              };
            }
          }
        }
      } catch {
        // Fallback to demo weather data
      }
    }

    // Default high-fidelity weather response
    return {
      location: loc && loc.toLowerCase() !== 'current location' ? loc : 'Command HQ (Atmospheric Sensors)',
      temperature: 22,
      apparentTemperature: 21,
      unit: '°C',
      condition: 'Clear sky',
      humidity: 48,
      windSpeed: 14,
      windUnit: 'km/h',
      forecast: [
        { day: 'Today', tempMax: 24, tempMin: 16, condition: 'Clear sky' },
        { day: 'Tue', tempMax: 23, tempMin: 15, condition: 'Partly cloudy' },
        { day: 'Wed', tempMax: 20, tempMin: 14, condition: 'Light drizzle' },
        { day: 'Thu', tempMax: 22, tempMin: 15, condition: 'Mainly clear' },
        { day: 'Fri', tempMax: 25, tempMin: 17, condition: 'Clear sky' },
      ],
      source: 'demo_data',
    };
  },
};

