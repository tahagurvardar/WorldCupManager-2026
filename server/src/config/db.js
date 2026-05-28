import mongoose from 'mongoose';
import { config } from './env.js';

let memoryServer;

export async function connectDatabase() {
  const useMemory = !config.mongoUri && config.nodeEnv !== 'production';

  if (useMemory) {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create({
      instance: { dbName: 'worldcupmanager2026' },
    });
  }

  const uri = config.mongoUri || memoryServer.getUri();
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);

  return {
    uri,
    isMemory: Boolean(useMemory),
  };
}

export async function closeDatabase() {
  await mongoose.connection.close();
  if (memoryServer) {
    await memoryServer.stop();
  }
}
