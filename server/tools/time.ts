import { ToolDefinition } from '../types.js';

interface TimeInput {
  timezone?: string;
  location?: string;
}

interface TimeOutput {
  formattedTime: string;
  formattedDate: string;
  dayOfWeek: string;
  isoString: string;
  timezone: string;
  utcOffset: string;
  worldClocks: Array<{
    city: string;
    time: string;
    diff: string;
  }>;
}

export const timeTool: ToolDefinition<TimeInput, TimeOutput> = {
  name: 'time',
  description: 'Provides current exact time, date, day of the week, timezone, and global world clock comparisons.',
  parameters: {
    type: 'object',
    properties: {
      timezone: {
        type: 'string',
        description: 'Specific timezone, e.g. "UTC", "America/New_York", "Asia/Tokyo", "Europe/London"',
      },
      location: {
        type: 'string',
        description: 'City name to check time for',
      },
    },
  },
  execute: async ({ timezone, location }) => {
    const now = new Date();

    // Map common locations to IANA timezones
    let resolvedTz = timezone;
    if (!resolvedTz && location) {
      const loc = location.toLowerCase();
      if (loc.includes('tokyo') || loc.includes('japan')) resolvedTz = 'Asia/Tokyo';
      else if (loc.includes('london') || loc.includes('uk')) resolvedTz = 'Europe/London';
      else if (loc.includes('new york') || loc.includes('nyc')) resolvedTz = 'America/New_York';
      else if (loc.includes('san francisco') || loc.includes('california') || loc.includes('pst')) resolvedTz = 'America/Los_Angeles';
      else if (loc.includes('paris') || loc.includes('france')) resolvedTz = 'Europe/Paris';
      else if (loc.includes('sydney') || loc.includes('australia')) resolvedTz = 'Australia/Sydney';
      else if (loc.includes('delhi') || loc.includes('mumbai') || loc.includes('india')) resolvedTz = 'Asia/Kolkata';
      else if (loc.includes('berlin') || loc.includes('germany')) resolvedTz = 'Europe/Berlin';
    }

    const tzOption = resolvedTz ? { timeZone: resolvedTz } : {};

    const formattedTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      ...tzOption,
    });

    const formattedDate = now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...tzOption,
    });

    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long', ...tzOption });

    // Calculate world clocks
    const worldClocks = [
      {
        city: 'New York (EDT)',
        time: now.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: true }),
        diff: 'UTC-4',
      },
      {
        city: 'London (BST)',
        time: now.toLocaleTimeString('en-US', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', hour12: true }),
        diff: 'UTC+1',
      },
      {
        city: 'Tokyo (JST)',
        time: now.toLocaleTimeString('en-US', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', hour12: true }),
        diff: 'UTC+9',
      },
      {
        city: 'Sydney (AEST)',
        time: now.toLocaleTimeString('en-US', { timeZone: 'Australia/Sydney', hour: '2-digit', minute: '2-digit', hour12: true }),
        diff: 'UTC+10',
      },
    ];

    return {
      formattedTime,
      formattedDate,
      dayOfWeek,
      isoString: now.toISOString(),
      timezone: resolvedTz || Intl.DateTimeFormat().resolvedOptions().timeZone,
      utcOffset: `UTC${now.getTimezoneOffset() > 0 ? '-' : '+'}${Math.abs(now.getTimezoneOffset() / 60)}`,
      worldClocks,
    };
  },
};

