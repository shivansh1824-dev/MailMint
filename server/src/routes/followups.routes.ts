import { Router } from 'express';
import { FollowupsController } from '../controllers/followups.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', FollowupsController.getFollowups);
router.post('/', FollowupsController.createFollowup);
router.put('/:id', FollowupsController.updateFollowup);
router.post('/:id/approve', FollowupsController.approveFollowup);
router.post('/:id/cancel', FollowupsController.cancelFollowup);

export default router;
