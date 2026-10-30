import { Router } from 'express';
import { analyzeForExtension, getExtensionStatus } from '../controllers/extensionController';

const router = Router();

router.post('/analyze', analyzeForExtension);
router.get('/status', getExtensionStatus);

export default router;
