import {Router} from 'express';
import { executeSQL } from '../controllers/sqlController';
import { sqlGuard } from '../middleware/sqlGuardMiddleware';
const router = Router();
router.post('/execute', sqlGuard, executeSQL);
export default router;