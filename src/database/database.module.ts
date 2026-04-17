import {
  Global,
  Injectable,
  Module,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  readonly drizzle: ReturnType<typeof drizzle<typeof schema>>;
  private readonly client: ReturnType<typeof postgres>;

  constructor(config: ConfigService) {
    this.client = postgres(
      config.getOrThrow<string>('POSTGRES_CONNECTION_STRING'),
    );
    this.drizzle = drizzle(this.client, { schema });
  }

  async onApplicationShutdown(): Promise<void> {
    await this.client.end();
  }
}

@Global()
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
