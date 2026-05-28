import { createApp } from './app.js';
import { connectDatabase } from './config/db.js';
import { assertEnv, config } from './config/env.js';
import { seedDatabase } from './seeds/seedAll2026.js';

async function bootstrap() {
  assertEnv();
  const connection = await connectDatabase();

  if (config.autoSeed) {
    const summary = await seedDatabase();
    if (!summary.skipped) {
      console.log(`Seeded WorldCupManager 2026 data: ${summary.teams} teams, ${summary.players} players, ${summary.matches} matches`);
    }
  }

  const app = createApp();
  app.listen(config.port, () => {
    console.log(`WorldCupManager 2026 API listening on http://localhost:${config.port}`);
    if (connection.isMemory) {
      console.log('Using development MongoDB memory server because MONGO_URI is not set.');
    }
  });
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
