import { Router } from 'express';
import { EmailsController } from '../controllers/emails.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', EmailsController.getEmails);
router.post('/', EmailsController.createEmail);
router.post('/send-test', EmailsController.sendTest);
router.get('/:id', EmailsController.getEmailById);
router.put('/:id', EmailsController.updateEmail);
router.delete('/:id', EmailsController.deleteEmail);
router.post('/:id/send', EmailsController.sendEmail);
router.post('/:id/schedule', EmailsController.scheduleEmail);
router.post('/:id/approve-followup', EmailsController.approveFollowup);
router.post('/:id/sentiment-sync', EmailsController.syncReplySentiment);

export default router;
