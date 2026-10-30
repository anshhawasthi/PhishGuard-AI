import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bcrypt from 'bcryptjs';
import { config } from './config';
import { connectDB, isDbConnected } from './database/connection';
import { User } from './models/User';
import { ModelManager } from './ml/modelManager';

import authRoutes from './routes/authRoutes';
import scanRoutes from './routes/scanRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import adminRoutes from './routes/adminRoutes';
import extensionRoutes from './routes/extensionRoutes';

const app = express();

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Automatically reflect request origin to prevent Chrome Extension / Vercel CORS blocks
      callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/scans', scanRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/extension', extensionRoutes);

// System Health Endpoint
app.get('/api/health', (req, res) => {
  const modelManager = ModelManager.getInstance();
  res.json({
    status: 'healthy',
    database: isDbConnected() ? 'connected' : 'offline/fallback',
    active_model: modelManager.getActiveModelName(),
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Admin Bootstrap Routine
async function bootstrapAdmin() {
  if (!isDbConnected()) return;
  try {
    const existingAdmin = await User.findOne({ email: config.adminEmail.toLowerCase() });
    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(config.adminPassword, salt);
      await User.create({
        full_name: 'System Administrator',
        email: config.adminEmail.toLowerCase(),
        password_hash,
        role: 'admin',
        is_active: true,
      });
      console.log(`[Bootstrap] Created initial admin account: ${config.adminEmail}`);
    }
  } catch (err: any) {
    console.warn(`[Bootstrap] Admin bootstrap skipped: ${err.message}`);
  }
}

// Start Server
async function startServer() {
  console.log('====================================================');
  console.log('  PhishGuard AI – Automated Phishing Detection System');
  console.log('  MERN Stack Architecture (Express + Node + React)   ');
  console.log('====================================================');

  // Attempt DB connection and bootstrap admin
  connectDB()
    .then(async (connected) => {
      if (connected) await bootstrapAdmin();
    })
    .catch((err) => {
      console.warn('[Database] Async connection handler:', err.message);
    });

  // Initialize Machine Learning Engine
  const modelManager = ModelManager.getInstance();
  await modelManager.initialize();

  app.listen(config.port, () => {
    console.log(`[Server] PhishGuard AI Backend listening on port ${config.port}`);
    console.log(`[Server] Health Check available at http://localhost:${config.port}/api/health`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
});

export default app;
