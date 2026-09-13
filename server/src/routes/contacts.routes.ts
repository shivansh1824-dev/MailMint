import { Router } from 'express';
import { ContactsController } from '../controllers/contacts.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', ContactsController.getContacts);
router.post('/', ContactsController.createContact);
router.post('/import', ContactsController.importContacts);
router.post('/bulk-action', ContactsController.bulkAction);
router.get('/:id', ContactsController.getContactById);
router.put('/:id', ContactsController.updateContact);
router.delete('/:id', ContactsController.deleteContact);
router.post('/:id/snooze', ContactsController.snooze);
router.post('/:id/unsnooze', ContactsController.unsnooze);
router.get('/:id/timeline', ContactsController.getTimeline);
router.post('/:id/timeline', ContactsController.addTimelineEntry);

export default router;
