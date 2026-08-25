import { getClient, pool } from '../config/database';
import fs from 'fs';
import path from 'path';

async function runMigrations() {
  try {
    console.log('Running database migrations...');

    const hasUsersTable = await pool
      .query(`SELECT to_regclass('public.users') as exists`)
      .then((result) => Boolean(result.rows[0]?.exists))
      .catch(() => false);

    if (!hasUsersTable) {
      const schemaPath = path.resolve(__dirname, '../../src/database/schema.sql');
      const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
      await pool.query(schemaSql);
    }

    await pool.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
         id TEXT PRIMARY KEY,
         applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
       )`
    );

    const migrationsDir = path.resolve(__dirname, '../../src/database/migrations');
    if (fs.existsSync(migrationsDir)) {
      const migrationFiles = fs
        .readdirSync(migrationsDir)
        .filter((file) => file.endsWith('.sql'))
        .sort();

      for (const file of migrationFiles) {
        const result = await pool.query(`SELECT 1 FROM schema_migrations WHERE id = $1`, [file]);
        if (result.rowCount) {
          continue;
        }

        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

        // One client for the whole transaction: pool.query() can hand each
        // statement a different connection, which would leave a migration
        // applied outside its BEGIN/COMMIT and unrollbackable on failure.
        const client = await getClient();
        try {
          await client.query('BEGIN');
          await client.query(sql);
          await client.query(`INSERT INTO schema_migrations (id) VALUES ($1)`, [file]);
          await client.query('COMMIT');
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      }
    }

    console.log('Migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
