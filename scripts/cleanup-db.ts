import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function cleanup() {
  try {
    console.log('Dropping existing users table and sequences...');
    
    await sql`
      DROP TABLE IF EXISTS users CASCADE;
    `;
    
    await sql`
      DROP SEQUENCE IF EXISTS users_id_seq CASCADE;
    `;
    
    console.log('Cleanup completed successfully!');
    
    // Verify no users table exists
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'users';
    `;
    
    if (tables.length === 0) {
      console.log('✓ Verified: users table does not exist');
    } else {
      console.log('⚠ Warning: users table still exists');
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

cleanup();

