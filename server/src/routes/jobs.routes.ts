import { Router } from 'express';
import { JobsController } from '../controllers/jobs.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', JobsController.getJobs);
router.post('/', JobsController.createJob);
router.post('/analyze', JobsController.analyzeJobDescription);
router.post('/import-linkedin', JobsController.importLinkedInJob);
router.get('/:id', JobsController.getJobById);
router.put('/:id', JobsController.updateJob);
router.delete('/:id', JobsController.deleteJob);

export default router;
