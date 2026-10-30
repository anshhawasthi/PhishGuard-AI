import { Router } from 'express';
import { getDashboardStats, getRecentActivity } from '../controllers/dashboardController';

const router = Router();

router.get('/stats', getDashboardStats);
router.get('/activity', getRecentActivity);

export default router;
