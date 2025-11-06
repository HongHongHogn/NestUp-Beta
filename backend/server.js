import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { notFound, errorHandler } from './middleware/error.js';
import authRoutes from './routes/auth.js';
import validateRoutes from './routes/validate.js';
import reportRoutes from './routes/report.js';
import workspaceRoutes from './routes/workspace.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({ origin: corsOrigin }));
app.use(express.json());
app.use(morgan('dev'));

// Basic rate limiting for API
const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 120 });
app.use('/api', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/validate', validateRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/workspace', workspaceRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'NestUp AI Backend is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// 404 and error handlers
app.use(notFound);
app.use(errorHandler);
