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

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/schemas', schemaRoutes);
app.use('/api/shapes', shapeRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/upload', uploadRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});