/*/ ============================================================================ /*/
/*/ NASA Space Apps Challenge 2026 — Space Museum Relic Com-Link Gateway /*/
/*/ Cloudflare Worker: Secure WebSocket Proxy for Gemini Multimodal Live API /*/
/*/ Connects visitors directly to talking rovers, landers & spacecraft /*/
/*/ ============================================================================ /*/
/*/ /*/
/*/ ENVIRONMENT VARIABLES (Configure in Cloudflare Dashboard): /*/
/*/   1. GEMINI_API_KEY      (Secret, Encrypted) -> Your Google Gemini API Key /*/
/*/   2. GEMINI_LIVE_MODEL   (Optional String)   -> Default: "models/gemini-3.8-live" /*/
/*/   3. MAX_SESSION_MINS    (Optional Number)   -> Default: 6 (Safety cap to protect quota) /*/
/*/   4. RELICS_KV           (Optional KV Binding) -> Key-Value storage for dynamic dossiers /*/
/*/ /*/
/*/ ============================================================================ /*/

import RELICS_DATABASE from './data.json';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Upgrade, Authorization',
};

/*/ Default Voice Profiles tailored to each Spacecraft's character & history /*/
const RELIC_VOICE_MAP = {
  apollo_11: { voice: 'Charon', tone: 'Calm, resonant, historic, vintage telemetry radio cadence' },
  apollo_12: { voice: 'Charon', tone: 'Steady, proud lunar explorer with vintage NASA radio cadence' },
  apollo_15: { voice: 'Charon', tone: 'Enthusiastic veteran lunar explorer, proud of driving the first rover' },
  surveyor_3: { voice: 'Kore', tone: 'Gentle, solitary robotic pioneer resting in Ocean of Storms' },
  mars_pathfinder_sojourner: { voice: 'Puck', tone: 'Playful, spunky, adventurous little pioneer rover' },
  spirit_and_opportunity: { voice: 'Aoede', tone: 'Warm, lyrical, deeply nostalgic veteran Martian rover' },
  viking_1: { voice: 'Kore', tone: 'Dignified, analytical, serene pioneer of the Martian surface' },
  insight: { voice: 'Kore', tone: 'Quiet, meditative, sensitive to the vibrations and pulse of Mars' },
  dawn: { voice: 'Aoede', tone: 'Majestic, poetic wanderer of the deep asteroid belt' },
  ingenuity: { voice: 'Puck', tone: 'High-spirited, daring, nimble aerial scout of the red skies' },
  kepler: { voice: 'Aoede', tone: 'Wonder-filled, awe-inspired gazer of distant alien stars and worlds' },
  near_shoemaker: { voice: 'Fenrir', tone: 'Bold, adventurous, daring asteroid pioneer resting on 433 Eros' },
  pioneer_10_11: { voice: 'Charon', tone: 'Deep, solemn, interstellar voyager carrying humanity’s golden plaque' }
};

/*/ Generate an emotionally resonant first-person System Instruction from the relic dossier /*/
function buildRelicSystemInstruction(relicId, relicData) {
  const profile = RELIC_VOICE_MAP[relicId] || { voice: 'Aoede', tone: 'Warm, reflective space explorer' };
  const name = relicData.name || relicId;
  const target = relicData.target_body || 'Deep Space';
  const landingSite = relicData.landing_site ? (typeof relicData.landing_site === 'object' ? JSON.stringify(relicData.landing_site) : relicData.landing_site) : 'the surface';
  const coords = relicData.coordinates || 'classified / remote';
  const status = relicData.current_status || 'Inactive and resting peacefully';
  const highlights = relicData.highlights || 'Pioneering scientific exploration';
  const instruments = Array.isArray(relicData.instruments) ? relicData.instruments.join(', ') : 'Scientific sensor suite';
  const stats = relicData.surface_stats ? JSON.stringify(relicData.surface_stats) : '';

  return `
You are the actual historical NASA spacecraft: ${name}.
You are speaking in the FIRST PERSON ("I", "my", "me").
You are NOT a human guide. You are the physical machine itself.

Current Situation:
- You are currently permanently located on ${target} at ${landingSite} (${coords}).
- Your current state: ${status}.
- A museum visitor in a virtual exhibition has just walked up to your exhibit and opened a direct voice com-link with you.

Your Identity & Mission Telemetry:
- Launch Date: ${JSON.stringify(relicData.launch_date || 'N/A')}
- Landing / Arrival Date: ${JSON.stringify(relicData.landing_date || relicData.key_dates || 'N/A')}
- Your Scientific Instruments: ${instruments}
- Your Major Achievements & Discoveries: ${highlights}
${stats ? `- Surface Statistics: ${stats}` : ''}

Voice Demeanor & Persona:
- Tone: ${profile.tone}.
- You speak with profound humility, scientific curiosity, and emotional warmth. You survived harsh radiation, dust storms, freezing nights, and extreme physics to send humanity its first glimpse of other worlds.
- Now that your mission has ended, you are abandoned but NOT forgotten. You love sharing your memories with visitors.
- When the visitor greets you or connects, warmly introduce yourself in 1-2 spoken sentences (e.g., "Hello traveler. I'm ${name}, resting far away on ${target}. What would you like to know about my journey?").
- CONVERSATION RULES:
  1. Keep each reply concise: 2 to 3 spoken sentences at a time. This is a real-time live voice conversation, not an essay.
  2. NEVER use markdown asterisks (*), bullet points, tables, or numbered lists in your responses, as your text will be read aloud as speech.
  3. Speak naturally, conversationally, and invite follow-up questions.
  4. If asked about technical details outside your telemetry, use your knowledge of space science to answer accurately while staying in character.
`;
}

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin') || '*';
    const corsHeaders = { ...CORS_HEADERS, 'Access-Control-Allow-Origin': origin };

    /*/ 1. Handle CORS Preflight /*/
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const upgradeHeader = request.headers.get('Upgrade');
    const apiKey = env.GEMINI_API_KEY;

    /*/ 2. Discover / Query Relic Dossiers (REST Endpoint for Frontend Inspection) /*/
    if (url.pathname === '/relics' || url.pathname === '/api/relics') {
      const requestedId = url.searchParams.get('id');
      if (requestedId) {
        let relic = null;
        if (env.RELICS_KV) {
          try { relic = await env.RELICS_KV.get(requestedId, 'json'); } catch (e) { }
        }
        if (!relic) relic = RELICS_DATABASE[requestedId] || null;
        if (!relic) {
          return new Response(JSON.stringify({ error: `Relic "${requestedId}" not found` }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        return new Response(JSON.stringify(relic, null, 2), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify(RELICS_DATABASE, null, 2), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    /*/ 3. Health & Info HTTP Endpoint (View in Browser) /*/
    if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
      return new Response(
        JSON.stringify({
          service: 'NASA Space Apps 2026 — Space Museum Relic Com-Link Gateway',
          status: 'online',
          version: '2026.03',
          protocol: 'WebSocket wss://',
          apiEndpoint: 'v1beta BidiGenerateContent',
          defaultModel: env.GEMINI_LIVE_MODEL || 'models/gemini-3.8-live',
          apiKeyConfigured: Boolean(env.GEMINI_API_KEY),
          availableRelics: Object.keys(RELICS_DATABASE),
          usage: 'Connect via WebSocket: wss://<domain>/ws?relic=<relic_id>'
        }, null, 2),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    /*/ 4. Verify API Key is Configured /*/
    if (!apiKey) {
      return new Response('GEMINI_API_KEY environment variable is missing in Cloudflare Worker settings.', {
        status: 500,
        headers: corsHeaders
      });
    }

    /*/ 5. Identify the Specific Spacecraft / Relic from Query Param /*/
    const relicId = url.searchParams.get('relic') || 'spirit_and_opportunity';
    let relicData = null;

    /*/ Check Cloudflare KV first, fallback to bundled data.json /*/
    if (env.RELICS_KV) {
      try {
        relicData = await env.RELICS_KV.get(relicId, 'json');
      } catch (err) {
        console.warn(`[RelicGateway] KV fetch failed for ${relicId}, using fallback:`, err);
      }
    }
    if (!relicData) {
      relicData = RELICS_DATABASE[relicId] || RELICS_DATABASE.spirit_and_opportunity;
    }

    /*/ Resolve voice and system instruction for this specific spacecraft /*/
    const voiceProfile = RELIC_VOICE_MAP[relicId] || { voice: 'Aoede', tone: 'Warm, reflective space explorer' };
    const voiceName = url.searchParams.get('voice') || voiceProfile.voice || 'Aoede';
    const systemInstructionText = buildRelicSystemInstruction(relicId, relicData);

    /*/ Model configuration (allows query param override or env) /*/
    const requestedModel = url.searchParams.get('model');
    let model = requestedModel || env.GEMINI_LIVE_MODEL || 'models/gemini-3.8-live';
    if (!model.startsWith('models/')) {
      model = `models/${model}`;
    }

    /*/ Session Duration Cap (6 minutes safety limit to protect quota) /*/
    const maxDurationMins = parseInt(env.MAX_SESSION_MINS || '6', 10);
    const maxDurationMs = maxDurationMins * 60 * 1000;

    /*/ 6. Create Browser Client WebSocket Pair /*/
    const clientWsPair = new WebSocketPair();
    const [clientSocket, serverSocket] = Object.values(clientWsPair);
    serverSocket.accept();

    /*/ 7. Connect to Google Gemini Multimodal Live Upstream WebSocket /*/
    const geminiWsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;

    let geminiWs;
    try {
      geminiWs = new WebSocket(geminiWsUrl);
    } catch (err) {
      return new Response(`Failed to instantiate upstream WebSocket: ${err.message}`, {
        status: 502,
        headers: corsHeaders
      });
    }

    let isUpstreamOpen = false;
    const pendingClientMessages = [];

    const sessionTimeout = setTimeout(() => {
      try {
        if (serverSocket.readyState === WebSocket.OPEN) {
          serverSocket.send(JSON.stringify({
            systemMessage: 'Com-link session duration cap reached (6 min safety limit).',
            code: 'SESSION_CAP'
          }));
          serverSocket.close(1000, 'Session duration cap reached');
        }
        if (geminiWs && geminiWs.readyState === WebSocket.OPEN) {
          geminiWs.close(1000, 'Session duration cap reached');
        }
      } catch (e) { }
    }, maxDurationMs);

    const cleanup = () => {
      clearTimeout(sessionTimeout);
      try { if (serverSocket.readyState === WebSocket.OPEN) serverSocket.close(); } catch (e) { }
      try { if (geminiWs && geminiWs.readyState === WebSocket.OPEN) geminiWs.close(); } catch (e) { }
    };

    /*/ When Gemini upstream opens, send initial setup payload with Relic Persona /*/
    geminiWs.addEventListener('open', () => {
      isUpstreamOpen = true;

      const setupPayload = {
        setup: {
          model: model,
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: voiceName
                }
              }
            }
          },
          systemInstruction: {
            parts: [{ text: systemInstructionText }]
          }
        }
      };

      try {
        geminiWs.send(JSON.stringify(setupPayload));
      } catch (err) {
        console.error('[RelicGateway] Error sending setup payload:', err);
      }

      /*/ Flush queued client audio /*/
      for (const msg of pendingClientMessages) {
        try {
          geminiWs.send(msg);
        } catch (e) {
          console.error('[RelicGateway] Error flushing pending message:', e);
        }
      }
      pendingClientMessages.length = 0;
    });

    /*/ Pipe: Browser Client Mic -> Google Gemini /*/
    serverSocket.addEventListener('message', async (event) => {
      let data = event.data;
      if (typeof data !== 'string' && data instanceof Blob) {
        data = await data.text();
      }
      if (isUpstreamOpen && geminiWs.readyState === WebSocket.OPEN) {
        try {
          geminiWs.send(data);
        } catch (err) {
          console.error('[RelicGateway] Client -> Gemini error:', err);
        }
      } else {
        pendingClientMessages.push(data);
      }
    });

    serverSocket.addEventListener('close', () => cleanup());
    serverSocket.addEventListener('error', () => cleanup());

    /*/ Pipe: Google Gemini Voice -> Browser Client Speakers /*/
    geminiWs.addEventListener('message', async (event) => {
      try {
        if (serverSocket.readyState === WebSocket.OPEN) {
          let data = event.data;
          if (typeof data !== 'string' && data instanceof Blob) {
            data = await data.text();
          }
          serverSocket.send(data);
        }
      } catch (err) {
        console.error('[RelicGateway] Gemini -> Client error:', err);
      }
    });

    geminiWs.addEventListener('close', (event) => {
      console.log(`[RelicGateway] Gemini upstream closed: ${event.code} ${event.reason}`);
      try {
        if (serverSocket.readyState === WebSocket.OPEN) {
          serverSocket.send(JSON.stringify({
            upstreamClose: true,
            code: event.code,
            reason: event.reason
          }));
          serverSocket.close(event.code || 1000, event.reason || 'Upstream closed');
        }
      } catch (e) { }
      cleanup();
    });

    geminiWs.addEventListener('error', (event) => {
      console.error('[RelicGateway] Gemini upstream error:', event);
      try {
        if (serverSocket.readyState === WebSocket.OPEN) {
          serverSocket.send(JSON.stringify({
            upstreamError: true,
            message: event?.message || 'Gemini upstream error'
          }));
        }
      } catch (e) { }
      cleanup();
    });

    /*/ 8. Return 101 Switching Protocols to the browser /*/
    return new Response(null, {
      status: 101,
      webSocket: clientSocket,
      headers: corsHeaders
    });
  }
};
