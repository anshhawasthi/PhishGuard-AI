import { Router } from 'express';
import multer from 'multer';
import {
  getUsers,
  toggleUserStatus,
  getAdminStats,
  uploadDataset,
  trainModels,
  getModelPerformance,
  activateModel,
} from '../controllers/adminController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();
const upload = multer({ limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB limit

// Admin-protected routes
router.use(authenticate, requireAdmin);

router.get('/users', getUsers);
router.patch('/users/:user_id/toggle', toggleUserStatus);
router.get('/stats', getAdminStats);
router.post('/datasets/upload', upload.single('dataset'), uploadDataset);
router.post('/models/train', trainModels);
router.get('/models/performance', getModelPerformance);
router.post('/models/activate', activateModel);

export default router;
