import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import {
  generate,
  getAll,
  getOne,
  toggleFavorite,
  remove,
} from '../controllers/recipeController';

const router = Router();

// All recipe routes require authentication
router.use(authenticate);

// POST   /api/recipes/generate        — generate + auto-save a recipe
router.post('/generate', generate);

// GET    /api/recipes                 — list all (lightweight, no body JSON)
router.get('/', getAll);

// GET    /api/recipes/:id             — full recipe detail
router.get('/:id', getOne);

// PATCH  /api/recipes/:id/favorite    — toggle isFavorite
router.patch('/:id/favorite', toggleFavorite);

// DELETE /api/recipes/:id             — delete
router.delete('/:id', remove);

export default router;
