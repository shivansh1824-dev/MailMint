import { Router } from 'express';
import { ApplicationsController } from '../controllers/applications.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', ApplicationsController.getApplications);
router.post('/', ApplicationsController.createApplication);
router.put('/:id', ApplicationsController.updateApplication);
router.delete('/:id', ApplicationsController.deleteApplication);

export default router;
