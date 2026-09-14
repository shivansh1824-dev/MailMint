import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import dns from 'dns';

// Force Node.js to resolve IPv4 addresses first to avoid ENETUNREACH on systems without IPv6 routing
try {
  if (typeof dns.setDefaultResultOrder === 'function') {
    dns.setDefaultResultOrder('ipv4first');
  }
} catch {
  // Ignored
}

import { ENV } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';
import { CronService } from './services/cron.service';

// Import Routes
import authRoutes from './routes/auth.routes';
import profileRoutes from './routes/profile.routes';
import contactsRoutes from './routes/contacts.routes';
import companiesRoutes from './routes/companies.routes';
import jobsRoutes from './routes/jobs.routes';
import applicationsRoutes from './routes/applications.routes';
import aiRoutes from './routes/ai.routes';
import emailsRoutes from './routes/emails.routes';
import campaignsRoutes from './routes/campaigns.routes';
import templatesRoutes from './routes/templates.routes';
import followupsRoutes from './routes/followups.routes';
import analyticsRoutes from './routes/analytics.routes';
import integrationsRoutes from './routes/integrations.routes';
import settingsRoutes from './routes/settings.routes';
import notificationsRoutes from './routes/notifications.routes';

const app = express();

// Trust reverse proxies (Vercel, Cloudflare, Render) for accurate client IP & protocol
app.set('trust proxy', 1);

// Security Middlewares with explicit cross-origin resource access
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows cross-origin asset loads in dev
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: false,
  })
);

// Robust CORS handling for all environments
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (ENV.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Local storage static files
const storageDir = path.resolve(__dirname, '../data/storage');
app.use('/api/storage', express.static(storageDir));

// Rate Limiting on general API routes
app.use('/api', generalLimiter);

// Health Check (supported on both /health and /api/health for Render/Vercel/AWS probes)
app.get(['/health', '/api/health'], (req, res) => {
  res.json({
    status: 'ok',
    name: 'MailMint API',
    tagline: 'Fresh outreach. Real connections.',
    timestamp: new Date().toISOString(),
    env: ENV.NODE_ENV,
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/emails', emailsRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/templates', templatesRoutes);
app.use('/api/followups', followupsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/integrations', integrationsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationsRoutes);

// Error Handler
app.use(errorHandler);

// Start Server & Background Services
const server = app.listen(ENV.PORT, () => {
  console.log(`
  ┌────────────────────────────────────────────────────────┐
  │  MAILMINT API SERVER                                   │
  │  "Fresh outreach. Real connections."                  │
  ├────────────────────────────────────────────────────────┤
  │  Status: RUNNING                                       │
  │  Port: ${ENV.PORT}                                            │
  │  Mode: ${ENV.NODE_ENV}                                     │
  │  Frontend URL: ${ENV.FRONTEND_URL}                     │
  └────────────────────────────────────────────────────────┘
  `);

  CronService.init();
});

export default app;
