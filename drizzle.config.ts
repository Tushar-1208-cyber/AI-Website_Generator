import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// `import 'dotenv/config'` only loads `.env` by default, not `.env.local`
// (which is the convention Next.js uses). Load it explicitly so
// `npm run db:push` picks up DATABASE_URL without setting it manually.
config({ path: '.env.local' });

export default defineConfig({
  schema: './config/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
