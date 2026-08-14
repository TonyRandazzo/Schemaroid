import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import schemaRoutes from './routes/schemaRoutes.js';
import shapeRoutes from './routes/shapeRoutes.js';
import connectionRoutes from './routes/connectionRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

const allowedOrigins = (process.env.CORS_ORIGIN ?? '')
  .split(',')
  .map(o => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);

app.use(cors(
  allowedOrigins.length
    ? {
        origin(origin, callback) {
          if (!origin || allowedOrigins.includes(origin.replace(/\/+$/, ''))) {
            return callback(null, true);
          }
          return callback(new Error(`Origine non consentita: ${origin}`));
        },
      }
    : {}
));

app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/schemas', schemaRoutes);
app.use('/api/shapes', shapeRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/upload', uploadRoutes);

app.use((req, res) => {
  res.status(404).json({ error: `Rotta non trovata: ${req.method} ${req.originalUrl}` });
});

app.use((err, _req, res, _next) => {
  const status = /Origine non consentita/.test(err.message) ? 403 : 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: err.message || 'Errore interno' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(
    allowedOrigins.length
      ? `CORS limitato a: ${allowedOrigins.join(', ')}`
      : 'CORS aperto a qualsiasi origine (CORS_ORIGIN non impostata)'
  );
});
