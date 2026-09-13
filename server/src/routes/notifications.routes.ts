import { Router } from 'express';
import { NotificationsController } from '../controllers/notifications.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', NotificationsController.getNotifications);
router.put('/read-all', NotificationsController.markAllAsRead);
router.put('/:id/read', NotificationsController.markAsRead);

export default router;
