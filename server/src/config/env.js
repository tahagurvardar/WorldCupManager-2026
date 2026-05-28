import dotenv from 'dotenv';

dotenv.config();

const requiredInProduction = ['JWT_SECRET', 'MONGO_URI'];

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  clientOrigins: (process.env.CLIENT_ORIGINS || `${process.env.CLIENT_ORIGIN || 'http://localhost:5173'},http://127.0.0.1:5173`)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  mongoUri: process.env.MONGO_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'development-only-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  autoSeed: process.env.AUTO_SEED !== 'false',
};

export function assertEnv() {
  if (config.nodeEnv !== 'production') return;

  const missing = requiredInProduction.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing production environment variables: ${missing.join(', ')}`);
  }
}
