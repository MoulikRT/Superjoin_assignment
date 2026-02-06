import {Router} from 'express';
import { handleWebhook } from '../controllers/webhookControllers';

const router = Router();

router.post('/webhook', handleWebhook);
export default router;