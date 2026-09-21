import { IntentType } from '../types.js';

export interface AIProvider {
  name: string;
  generateResponse(prompt: string): Promise<string>;
  summarizeToolResults(
    intent: IntentType,
    toolName: string,
    data: any,
    userQuery: string
  ): Promise<{ spoken: string; text: string }>;
}

export class DemoAIProvider implements AIProvider {
  name = 'JARVIS Deterministic Neural Core';

  async generateResponse(prompt: string): Promise<string> {
    return `Protocol executed. Analysis completed for prompt: "${prompt.slice(0, 40)}...". All subsystems operating within normal parameters.`;
  }

  async summarizeToolResults(
    intent: IntentType,
    toolName: string,
    data: any,
    userQuery: string
  ): Promise<{ spoken: string; text: string }> {
    switch (intent) {
      case 'NEWS_SEARCH': {
        const count = data.articles?.length || 0;
        const top1 = data.articles?.[0]?.title || 'technological breakthroughs';
        const top2 = data.articles?.[1]?.title || 'frontier model developments';
        return {
          spoken: `I have retrieved ${count} recent intelligence reports. The leading headline is: ${top1}. A visual feed is rendered on your HUD.`,
          text: `Retrieved ${count} primary news reports. Key focus: ${top1}, and ${top2}. Source streams and summaries active in visual panel.`,
        };
      }

      case 'CALCULATOR': {
        const result = data.formattedResult || data.result;
        return {
          spoken: `The calculation result is ${result}.`,
          text: `Calculation verified: ${data.expression} = ${result}. Operational steps logged below.`,
        };
      }

      case 'MEMORY_STORE': {
        return {
          spoken: `Understood, sir. I have committed that to memory.`,
          text: data.message || `Information permanently recorded to synaptic database under key: "${data.memory?.key}".`,
        };
      }

      case 'MEMORY_RECALL': {
        if (!data.found) {
          return {
            spoken: `I searched the neural archives, but found no matching records for that inquiry, sir.`,
            text: data.summary,
          };
        }
        const first = data.memories[0];
        return {
          spoken: `Recalling from memory: ${first.key} is recorded as ${first.content}.`,
          text: data.summary,
        };
      }

      case 'WEATHER': {
        const loc = data.location || 'Current location';
        const temp = data.temperature;
        const cond = data.condition;
        return {
          spoken: `Conditions in ${loc.split(',')[0]} are currently ${cond}, at ${temp} degrees Celsius.`,
          text: `Current atmospheric readout for ${loc}: ${temp}°C, ${cond}. Wind at ${data.windSpeed} ${data.windUnit}, humidity ${data.humidity}%. 5-day forecast projected on HUD.`,
        };
      }

      case 'TIME': {
        return {
          spoken: `The time is currently ${data.formattedTime}, ${data.dayOfWeek}.`,
          text: `Temporal coordinates: ${data.formattedTime} (${data.timezone}, ${data.utcOffset}) on ${data.formattedDate}. Global clocks active.`,
        };
      }

      case 'SYSTEM_STATUS': {
        return {
          spoken: `All systems are operating at peak efficiency, sir. Uptime is ${data.uptimeFormatted}.`,
          text: `System Status: OPTIMAL. Uptime: ${data.uptimeFormatted}. Heap memory: ${data.memory?.heapUsedMB} MB. Database sync healthy.`,
        };
      }

      case 'DATABASE_QUERY': {
        return {
          spoken: `Displaying your recent interaction log on the command screen.`,
          text: data.summary || `Retrieved ${data.totalReturned} history entries from local storage.`,
        };
      }

      case 'WEB_SEARCH':
      default: {
        const hits = data.results?.length || 0;
        const topHit = data.results?.[0]?.title || userQuery;
        return {
          spoken: `Search concluded, sir. I found ${hits} relevant items, leading with ${topHit}.`,
          text: `Aggregated ${hits} verified sources regarding "${userQuery}". Verified summaries and source references loaded into your workspace.`,
        };
      }
    }
  }
}

export class GeminiProvider implements AIProvider {
  name = 'Google Gemini 2.5 Flash';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateResponse(prompt: string): Promise<string> {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 300,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error ${response.status}`);
      }

      const json = (await response.json()) as any;
      return (
        json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
        'JARVIS response synthesis failed.'
      );
    } catch {
      // Fall back to demo provider on error
      return new DemoAIProvider().generateResponse(prompt);
    }
  }

  async summarizeToolResults(
    intent: IntentType,
    toolName: string,
    data: any,
    userQuery: string
  ): Promise<{ spoken: string; text: string }> {
    const prompt = `You are JARVIS, Tony Stark's personal AI assistant. You speak with high precision, professional British butler refinement, and futuristic clarity.
The user asked: "${userQuery}".
Tool executed: ${toolName}.
Data result: ${JSON.stringify(data).slice(0, 1500)}.

Provide your response in JSON format with two keys:
1. "spoken": A very concise, natural voice sentence (1 to 2 sentences max) suitable for Text-To-Speech (no markdown, no URLs, no symbols).
2. "text": A polished, technical HUD briefing (2 to 4 sentences).
Respond ONLY with raw JSON: {"spoken": "...", "text": "..."}`;

    try {
      const raw = await this.generateResponse(prompt);
      const cleanJson = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      return {
        spoken: parsed.spoken || 'Operation complete, sir.',
        text: parsed.text || 'Intelligence loaded to display.',
      };
    } catch {
      // Fallback to deterministic provider
      return new DemoAIProvider().summarizeToolResults(intent, toolName, data, userQuery);
    }
  }
}

export function getAIProvider(): AIProvider {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && geminiKey !== 'your_gemini_api_key_here') {
    return new GeminiProvider(geminiKey);
  }
  return new DemoAIProvider();
}

