import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import authRoutes from './routes/auth';         // M2
import ingredientRoutes from './routes/ingredients'; // M3
import recipeRoutes from './routes/recipes';         // M4
import mealPlanRoutes from './routes/mealPlans';     // M5

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health ──────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Routes ──────────────────────────────────────────────
app.use('/api/auth', authRoutes);              // M2
app.use('/api/ingredients', ingredientRoutes); // M3
app.use('/api/recipes', recipeRoutes);           // M4
app.use('/api/meal-plans', mealPlanRoutes);       // M5

// ── Error handling ──────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;
