import { drizzle } from 'drizzle-orm/neon-http';

if (!process.env.DATABASE_URL) {
  throw new Error('Missing required environment variable: DATABASE_URL. Please ensure DATABASE_URL is set in your .env.local file.');
}

export const db = drizzle(process.env.DATABASE_URL);
