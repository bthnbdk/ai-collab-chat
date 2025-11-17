import { Context } from "@netlify/functions";
import sql, { ensureTableExists } from './db';
import { verifyJwt } from './auth';

export default async (req: Request, context: Context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }
  
  const tokenPayload = await verifyJwt(req);
  if (!tokenPayload) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
      status: 401,
      headers
    });
  }
  
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers
    });
  }
  
  const userId = tokenPayload.sub;
  if (!userId) {
     return new Response(JSON.stringify({ error: 'Unauthorized: User ID missing in token' }), {
      status: 401,
      headers
    });
  }

  try {
    const body = await req.json();
    const { apiKeys, masterPrompt, fineTuneSettings, apiModes } = body;

    await ensureTableExists(sql);

    const apiKeysJson = JSON.stringify(apiKeys);
    const fineTuneSettingsJson = JSON.stringify(fineTuneSettings);
    const apiModesJson = JSON.stringify(apiModes);

    await sql`
      INSERT INTO user_settings (user_id, api_keys, master_prompt, fine_tune_settings, api_modes)
      VALUES (${userId}, ${apiKeysJson}, ${masterPrompt}, ${fineTuneSettingsJson}, ${apiModesJson})
      ON CONFLICT (user_id) 
      DO UPDATE SET
        api_keys = EXCLUDED.api_keys,
        master_prompt = EXCLUDED.master_prompt,
        fine_tune_settings = EXCLUDED.fine_tune_settings,
        api_modes = EXCLUDED.api_modes;
    `;

    return new Response(JSON.stringify({ success: true, message: 'Settings saved' }), {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Failed to save settings:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers
    });
  }
};
