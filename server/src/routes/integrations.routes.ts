import { Router } from 'express';
import { IntegrationsController } from '../controllers/integrations.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/gmail/callback', IntegrationsController.handleGmailCallback);
router.post('/gmail/webhook', IntegrationsController.handleWebhook);

router.use(requireAuth);
router.get('/gmail/auth', IntegrationsController.getGmailAuthUrl);
router.post('/gmail/app-password', IntegrationsController.connectWithAppPassword);
router.get('/gmail/status', IntegrationsController.getGmailStatus);
router.delete('/gmail', IntegrationsController.disconnectGmail);
router.post('/gmail/test', IntegrationsController.sendTestEmail);

// Resend HTTP Email Integration
router.post('/resend/connect', IntegrationsController.connectResend);
router.post('/resend', IntegrationsController.connectResend);
router.delete('/resend', IntegrationsController.disconnectResend);

export default router;
