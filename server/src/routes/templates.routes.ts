import { Router } from 'express';
import { TemplatesController } from '../controllers/templates.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', TemplatesController.getTemplates);
router.post('/', TemplatesController.createTemplate);
router.get('/marketplace', TemplatesController.getMarketplace);
router.get('/:id', TemplatesController.getTemplateById);
router.put('/:id', TemplatesController.updateTemplate);
router.delete('/:id', TemplatesController.deleteTemplate);
router.post('/:id/duplicate', TemplatesController.duplicateTemplate);
router.post('/:id/publish', TemplatesController.publishTemplate);
router.post('/:id/import', TemplatesController.importTemplate);

export default router;
