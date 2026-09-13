import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', SettingsController.getSettings);
router.put('/', SettingsController.updateSettings);
router.put('/notifications', SettingsController.updateNotifications);
router.put('/outreach-limits', SettingsController.updateOutreachLimits);

export default router;
