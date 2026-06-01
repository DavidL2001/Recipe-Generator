import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import {
  getAll,
  getOne,
  create,
  update,
  remove,
  clearAll,
} from '../controllers/ingredientController';

const router = Router();

// All ingredient routes require authentication
router.use(authenticate);

// GET    /api/ingredients        — list all for current user
router.get('/', getAll);

// POST   /api/ingredients        — create new ingredient
router.post('/', create);

// DELETE /api/ingredients        — clear all for current user
router.delete('/', clearAll);

// GET    /api/ingredients/:id    — get single
router.get('/:id', getOne);

// PATCH  /api/ingredients/:id    — update
router.patch('/:id', update);

// DELETE /api/ingredients/:id    — delete single
router.delete('/:id', remove);

export default router;
