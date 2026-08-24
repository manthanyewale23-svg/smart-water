import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { seedDatabase } from './db/seed';

// Routes
import authRouter from './routes/auth';
import dashboardRouter from './routes/dashboard';
import zonesRouter from './routes/zones';
import consumptionRouter from './routes/consumption';
import waterLossRouter from './routes/waterLoss';
import sensorsRouter from './routes/sensors';
import mapRouter from './routes/map';
import complaintsRouter from './routes/complaints';
import maintenanceRouter from './routes/maintenance';
import alertsRouter from './routes/alerts';
import notificationsRouter from './routes/notifications';
import reportsRouter from './routes/reports';
import usersRouter from './routes/users';

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize DB with seed data
try {
  seedDatabase();
} catch (err) {
  console.error('❌ DB seed error:', err);
}

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
const uploadsPath = process.env.UPLOADS_PATH || './uploads';
app.use('/uploads', express.static(path.resolve(uploadsPath)));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/zones', zonesRouter);
app.use('/api/consumption', consumptionRouter);
app.use('/api/water-loss', waterLossRouter);
app.use('/api/sensors', sensorsRouter);
app.use('/api/map', mapRouter);
app.use('/api/complaints', complaintsRouter);
app.use('/api/maintenance', maintenanceRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/users', usersRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), message: 'SmartWater API running' });
});

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log('');
  console.log('🚀 ================================================');
  console.log(`💧 SmartWater Backend running on port ${PORT}`);
  console.log('📊 Database: SQLite (Demo Data Loaded)');
  console.log('');
  console.log('🔐 Demo Credentials:');
  console.log('   Admin:   admin@smartwater.gov  / Admin@123');
  console.log('   Worker:  worker@smartwater.gov / Worker@123');
  console.log('   Citizen: citizen@smartwater.gov / Citizen@123');
  console.log('');
  console.log(`🌐 API: http://localhost:${PORT}/api`);
  console.log('🚀 ================================================');
  console.log('');
});

export default app;
