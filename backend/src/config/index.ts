import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '8000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/phishguard_ai',
  jwtSecret: process.env.JWT_SECRET || 'phishguard_super_secret_jwt_key_2026_change_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@phishguard.ai',
  adminPassword: process.env.ADMIN_PASSWORD || 'Admin@PhishGuard2026!',
  googleSafeBrowsingKey: process.env.GOOGLE_SAFE_BROWSING_API_KEY || '',
  openphishApiKey: process.env.OPENPHISH_API_KEY || '',
  datasetsDir: path.resolve(__dirname, '../../datasets'),
  modelsDir: path.resolve(__dirname, '../../trained_models'),
};
