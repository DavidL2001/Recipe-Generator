import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { getAll, getOne, create, update, remove } from '../controllers/mealPlanController';

const router = Router();

router.use(authenticate);

// GET    /api/meal-plans          — list all (with lightweight day summary)
router.get('/', getAll);

// GET    /api/meal-plans/:id      — full plan with recipes
router.get('/:id', getOne);

// POST   /api/meal-plans          — create new plan
router.post('/', create);

// PATCH  /api/meal-plans/:id      — update name/dates/days
router.patch('/:id', update);

// DELETE /api/meal-plans/:id      — delete plan (cascades days)
router.delete('/:id', remove);

export default router;
