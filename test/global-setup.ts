import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import path from 'path';
import postgres from 'postgres';

const CONNECTION_STRING =
  process.env.POSTGRES_CONNECTION_STRING ??
  'postgres://postgres:password@localhost:5433/image_upload_test';

export default async function globalSetup(): Promise<void> {
  const client = postgres(CONNECTION_STRING, { max: 1 });
  await migrate(drizzle(client), {
    migrationsFolder: path.join(__dirname, '..', 'drizzle'),
  });
  await client.end();
}
