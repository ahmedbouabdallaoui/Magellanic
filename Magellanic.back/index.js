import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import constellationRoutes from './routes/constellations.js';
import commentRoutes from './routes/comments.js';
import progressRoutes from './routes/progress.js';
import achievementRoutes from './routes/achievements.js';
import locationRoutes from './routes/location.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/constellations', constellationRoutes);
app.use('/api', commentRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/users', locationRoutes);

app.listen(process.env.PORT || 3001, () => {
  console.log(`Server running on port ${process.env.PORT || 3001}`);
});
