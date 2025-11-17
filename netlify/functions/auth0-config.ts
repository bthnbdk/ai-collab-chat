import { Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  const {
    AUTH0_DOMAIN,
    AUTH0_CLIENT_ID,
    AUTH0_AUDIENCE
  } = process.env;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  const config = {
    domain: AUTH0_DOMAIN,
    clientId: AUTH0_CLIENT_ID,
    audience: AUTH0_AUDIENCE,
  };

  if (!config.domain || !config.clientId || !config.audience) {
    return new Response(JSON.stringify({ error: "Auth0 environment variables are not set on the server." }), {
      status: 500,
      headers
    });
  }

  return new Response(JSON.stringify(config), {
    status: 200,
    headers
  });
};
