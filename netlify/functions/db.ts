import { neon, NeonQueryFunction } from '@netlify/neon';

// The neon() function reads the DATABASE_URL from the environment variables
const sql = neon();

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS user_settings (
    user_id TEXT PRIMARY KEY,
    api_keys JSONB,
    master_prompt TEXT,
    fine_tune_settings JSONB,
    api_modes JSONB
  );
`;

let tableCreationPromise: Promise<void> | null = null;

export const ensureTableExists = async (sqlClient: NeonQueryFunction<false, false>): Promise<void> => {
  if (!tableCreationPromise) {
    tableCreationPromise = (async () => {
      try {
        await sqlClient(createTableQuery);
        console.log('Table "user_settings" is ready.');
      } catch (error) {
        console.error('Failed to create or verify table:', error);
        // Reset promise on failure to allow retries on subsequent calls
        tableCreationPromise = null; 
        throw error;
      }
    })();
  }
  return tableCreationPromise;
};

export default sql;