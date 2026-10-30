import { Router } from 'express';
import multer from 'multer';
import {
  analyze,
  getScans,
  getScanById,
  deleteScan,
  bulkScan,
  downloadReport,
} from '../controllers/scanController';
import { optionalAuthenticate, authenticate } from '../middleware/auth';

const router = Router();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB CSV limit

router.post('/analyze', optionalAuthenticate, analyze);
router.get('/', optionalAuthenticate, getScans);
router.get('/:scan_id', getScanById);
router.delete('/:scan_id', authenticate, deleteScan);
router.post('/bulk', optionalAuthenticate, upload.single('file'), bulkScan);
router.get('/:scan_id/report', downloadReport);

export default router;
