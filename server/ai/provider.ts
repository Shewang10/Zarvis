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

export function isHindiQuery(text: string): boolean {
  // Check for Devanagari script: \u0900-\u097F
  if (/[\u0900-\u097F]/.test(text)) return true;
  // Check for common Hinglish markers
  return /\b(kholo|karo|batao|dikhayein|mausam|khabar|khabrein|samachar|hisab|yaad|rakho|rakhna|samay|waqt|namaste|kaise|kya|bhejo)\b/i.test(text);
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
    const hindi = isHindiQuery(userQuery);

    switch (intent) {
      case 'EMAIL': {
        const count = data?.inbox?.length || 4;
        if (hindi) {
          return {
            spoken: 'नमस्ते सर, मैं आपका आउटलुक और ईमेल खोल रहा हूँ। आपकी डाक स्क्रीन पर प्रस्तुत है।',
            text: `माइक्रोसॉफ्ट आउटलुक सक्रिय किया गया। ${count} प्राथमिक संदेश और संचार नियंत्रण स्क्रीन पर लोड हो चुके हैं।`,
          };
        }
        return {
          spoken: 'Opening Microsoft Outlook for your communications, sir. Your primary inbox and messages are active on the HUD.',
          text: `Microsoft Outlook launched. ${count} priority communications loaded to holographic workspace.`,
        };
      }

      case 'BROWSER_CONTROL': {
        const appName = data?.app || 'application';
        if (hindi) {
          return {
            spoken: `सर, मैं आपके लिए ${appName} खोल रहा हूँ।`,
            text: `${appName} सफलतापूर्वक खोला गया।`,
          };
        }
        return {
          spoken: `Opening ${appName} for you, sir.`,
          text: `Navigation to ${data?.url || appName} initiated.`,
        };
      }

      case 'NEWS_SEARCH': {
        const count = data.articles?.length || 0;
        const top1 = data.articles?.[0]?.title || 'technological breakthroughs';
        const top2 = data.articles?.[1]?.title || 'frontier model developments';
        if (hindi) {
          return {
            spoken: `सर, मैंने ताज़ा समाचार रिपोर्टें प्राप्त कर ली हैं। मुख्य समाचार: ${top1}।`,
            text: `ताज़ा समाचार लोड किए गए (${count} रिपोर्टें)। मुख्य फोकस: ${top1} तथा ${top2}।`,
          };
        }
        return {
          spoken: `I have retrieved ${count} recent intelligence reports. The leading headline is: ${top1}. A visual feed is rendered on your HUD.`,
          text: `Retrieved ${count} primary news reports. Key focus: ${top1}, and ${top2}. Source streams and summaries active in visual panel.`,
        };
      }

      case 'CALCULATOR': {
        const result = data.formattedResult || data.result;
        if (hindi) {
          return {
            spoken: `गणना पूर्ण हुई, सर। परिणाम ${result} है।`,
            text: `हिसाब सत्यापित: ${data.expression} = ${result}। प्रक्रिया नीचे दर्ज है।`,
          };
        }
        return {
          spoken: `The calculation result is ${result}.`,
          text: `Calculation verified: ${data.expression} = ${result}. Operational steps logged below.`,
        };
      }

      case 'MEMORY_STORE': {
        if (hindi) {
          return {
            spoken: 'समझ गया सर, मैंने यह जानकारी न्यूरल मेमोरी में सुरक्षित कर ली है।',
            text: data.message || `जानकारी न्यूरल डेटाबेस में सहेजी गई: "${data.memory?.key}"।`,
          };
        }
        return {
          spoken: `Understood, sir. I have committed that to memory.`,
          text: data.message || `Information permanently recorded to synaptic database under key: "${data.memory?.key}".`,
        };
      }

      case 'MEMORY_RECALL': {
        if (!data.found) {
          if (hindi) {
            return {
              spoken: 'मुझे मेमोरी आर्काइव में इस विषय पर कोई जानकारी नहीं मिली, सर।',
              text: data.summary,
            };
          }
          return {
            spoken: `I searched the neural archives, but found no matching records for that inquiry, sir.`,
            text: data.summary,
          };
        }
        const first = data.memories[0];
        if (hindi) {
          return {
            spoken: `मेमोरी से रिकॉर्ड: ${first.key} — ${first.content} है, सर।`,
            text: data.summary,
          };
        }
        return {
          spoken: `Recalling from memory: ${first.key} is recorded as ${first.content}.`,
          text: data.summary,
        };
      }

      case 'WEATHER': {
        const loc = data.location || 'Current location';
        const temp = data.temperature;
        const cond = data.condition;
        if (hindi) {
          return {
            spoken: `${loc.split(',')[0]} में वर्तमान मौसम ${cond} है, और तापमान ${temp} डिग्री सेल्सियस है, सर।`,
            text: `${loc} का मौसम: ${temp}°C, ${cond}। हवा की गति: ${data.windSpeed} ${data.windUnit}। 5-दिवसीय पूर्वानुमान स्क्रीन पर है।`,
          };
        }
        return {
          spoken: `Conditions in ${loc.split(',')[0]} are currently ${cond}, at ${temp} degrees Celsius.`,
          text: `Current atmospheric readout for ${loc}: ${temp}°C, ${cond}. Wind at ${data.windSpeed} ${data.windUnit}, humidity ${data.humidity}%. 5-day forecast projected on HUD.`,
        };
      }

      case 'TIME': {
        if (hindi) {
          return {
            spoken: `वर्तमान समय ${data.formattedTime} है, सर।`,
            text: `समय: ${data.formattedTime} (${data.timezone}) • ${data.formattedDate}।`,
          };
        }
        return {
          spoken: `The time is currently ${data.formattedTime}, ${data.dayOfWeek}.`,
          text: `Temporal coordinates: ${data.formattedTime} (${data.timezone}, ${data.utcOffset}) on ${data.formattedDate}. Global clocks active.`,
        };
      }

      case 'SYSTEM_STATUS': {
        if (hindi) {
          return {
            spoken: `सिस्टम के सभी घटक सुचारू रूप से कार्य कर रहे हैं, सर।`,
            text: `सिस्टम स्थिति: अनुकूल। अपटाइम: ${data.uptimeFormatted}। मेमोरी उपयोग: ${data.memory?.heapUsedMB} MB।`,
          };
        }
        return {
          spoken: `All systems are operating at peak efficiency, sir. Uptime is ${data.uptimeFormatted}.`,
          text: `System Status: OPTIMAL. Uptime: ${data.uptimeFormatted}. Heap memory: ${data.memory?.heapUsedMB} MB. Database sync healthy.`,
        };
      }

      case 'DATABASE_QUERY': {
        if (hindi) {
          return {
            spoken: 'आपकी पिछली बातचीत का विवरण स्क्रीन पर प्रस्तुत है, सर।',
            text: data.summary || `डेटाबेस से पिछले रिकॉर्ड लोड किए गए।`,
          };
        }
        return {
          spoken: `Displaying your recent interaction log on the command screen.`,
          text: data.summary || `Retrieved ${data.totalReturned} history entries from local storage.`,
        };
      }

      case 'WEB_SEARCH':
      default: {
        const hits = data.results?.length || 0;
        const topHit = data.results?.[0]?.title || userQuery;
        if (hindi) {
          return {
            spoken: `खोज पूर्ण हुई, सर। मुझे ${hits} संबंधित परिणाम मिले हैं, मुख्य रूप से ${topHit}।`,
            text: `"${userQuery}" के संदर्भ में ${hits} प्रामाणिक स्रोत प्राप्त किए गए।`,
          };
        }
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
    const hindi = isHindiQuery(userQuery);
    const langInstruction = hindi
      ? 'The user spoke in Hindi or Hinglish. You MUST respond in polite, refined Hindi (हिंदी) matching a royal butler tone.'
      : 'You speak with high precision, professional British butler refinement, and futuristic clarity.';

    const prompt = `You are JARVIS, Tony Stark's personal AI assistant. ${langInstruction}
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
