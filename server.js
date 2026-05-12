import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import compression from 'compression';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Security: Set security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "script-src": ["'self'", "'unsafe-inline'", "https://apis.google.com", "https://www.gstatic.com", "https://*.firebaseio.com"],
      "connect-src": ["'self'", "https://*.firebaseio.com", "https://*.googleapis.com", "https://*.firebasedatabase.app", "https://*.google-analytics.com"],
      "img-src": ["'self'", "data:", "https://*.googleusercontent.com", "https://*.gstatic.com", "https://*.firebasestorage.app"]
    },
  },
}));

// Performance: Gzip compression
app.use(compression());

// Basic Rate Limiting (Simple implementation without external deps)
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100;

app.use((req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const now = Date.now();
  const userData = requestCounts.get(ip) || { count: 0, startTime: now };

  if (now - userData.startTime > RATE_LIMIT_WINDOW) {
    userData.count = 1;
    userData.startTime = now;
  } else {
    userData.count++;
  }

  requestCounts.set(ip, userData);

  if (userData.count > MAX_REQUESTS) {
    console.warn(`[SECURITY] Rate limit exceeded for IP: ${ip}`);
    return res.status(429).json({ error: 'Too many transmissions. Please wait.' });
  }
  next();
});

// Serve static files from the 'dist' directory with caching
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: '1d',
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// Health check endpoint with more details
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'Operational', 
    timestamp: new Date().toISOString(),
    version: '10.0.4',
    uptime: process.uptime()
  });
});

// Handle client-side routing: serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[SYSTEM] Brightstar Server listening on port ${PORT}`);
});
