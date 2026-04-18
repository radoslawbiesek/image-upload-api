import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import path from 'path';
import postgres from 'postgres';

config({ path: path.join(__dirname, '..', '.env.test') });

export default async function globalSetup(): Promise<void> {
  const connectionString = process.env.POSTGRES_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error('POSTGRES_CONNECTION_STRING is not set');
  }

  const client = postgres(connectionString, { max: 1 });
  await migrate(drizzle(client), {
    migrationsFolder: path.join(__dirname, '..', 'drizzle'),
  });
  await client.end();
}
