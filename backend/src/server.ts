import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

import { authRouter } from './routes/auth';
import { walletRouter } from './routes/wallet';
import { challengeRouter } from './routes/challenges';
import { mpesaRouter } from './routes/mpesa';
import { stepRouter } from './routes/steps';
import { userRouter } from './routes/user';
import { notificationRouter } from './routes/notifications';
import { errorHandler } from './middleware/errorHandler';
import { setupChallengeCronJobs } from './utils/challengeCron';

dotenv.config();

const app = express();
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://walktoearn.app', 'https://admin.walktoearn.app']
    : ['http://localhost:8081', 'http://localhost:19006', '*'],
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/wallet', walletRouter);
app.use('/api/challenges', challengeRouter);
app.use('/api/mpesa', mpesaRouter);
app.use('/api/steps', stepRouter);
app.use('/api/user', userRouter);
app.use('/api/notifications', notificationRouter);

// Global error handler
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Walk-to-Earn API server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💳 M-Pesa Environment: ${process.env.MPESA_ENV || 'sandbox'}`);
});

// Setup cron jobs
setupChallengeCronJobs();

export default app;
