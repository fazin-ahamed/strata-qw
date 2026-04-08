import { db } from './index';
import * as fs from 'fs';
import * as path from 'path';

async function runMigrations(): Promise<void> {
  try {
    await db.connect();

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Split by semicolons but handle comments
    const statements = schema
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`Running ${statements.length} migration statements...`);

    for (const statement of statements) {
      try {
        await db.query(statement + ';');
      } catch (error: any) {
        // Ignore "already exists" errors for idempotent migrations
        if (
          error.code === '42P07' || // duplicate_table
          error.code === '42710' || // duplicate_object
          error.code === '42P16'    // duplicate_function
        ) {
          console.log('Skipping (already exists):', statement.substring(0, 50) + '...');
          continue;
        }
        throw error;
      }
    }

    console.log('Migrations completed successfully!');
    await db.disconnect();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runMigrations();
}

export { runMigrations };
