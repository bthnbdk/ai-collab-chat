import { createRemoteJWKSet, jwtVerify } from 'jose';

const audience = process.env.AUTH0_AUDIENCE;
const issuer = process.env.AUTH0_ISSUER_BASE_URL;

if (!audience || !issuer) {
  throw new Error('Auth0 environment variables AUTH0_AUDIENCE and AUTH0_ISSUER_BASE_URL must be set.');
}

const JWKS = createRemoteJWKSet(new URL(`${issuer}.well-known/jwks.json`));

export const verifyJwt = async (req: Request) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('No or invalid Authorization header');
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: issuer,
      audience: audience,
    });
    return payload;
  } catch (err) {
    console.error('JWT verification failed:', err);
    return null;
  }
};