import { Context } from "@netlify/functions";
import sql, { ensureTableExists } from './db';
import { verifyJwt } from './auth';

export default async (req: Request, context: Context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
  
  const userId = tokenPayload.sub;
  if (!userId) {
     return new Response(JSON.stringify({ error: 'Unauthorized: User ID missing in token' }), {
      status: 401,
      headers
    });
  }

  try {
    await ensureTableExists(sql);
    
    const settings = await sql`
      SELECT api_keys, master_prompt, fine_tune_settings, api_modes 
      FROM user_settings 
      WHERE user_id = ${userId}
    `;

    if (settings.length === 0) {
      return new Response(JSON.stringify({ error: 'User settings not found' }), {
        status: 404,
        headers
      });
    }

    return new Response(JSON.stringify(settings[0]), {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Database query failed:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers
    });
  }
};
