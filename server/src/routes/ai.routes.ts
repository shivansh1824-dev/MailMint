import { Router } from 'express';
import { AiController } from '../controllers/ai.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.post('/generate-email', AiController.generateEmail);
router.post('/check-email', AiController.checkEmail);
router.post('/ghostwrite', AiController.ghostwrite);
router.post('/summarize-jd', AiController.summarizeJd);
router.post('/score-email', AiController.scoreEmail);
router.post('/suggest-subject-lines', AiController.suggestSubjectLines);
router.post('/research-company', AiController.researchCompany);
router.post('/generate-linkedin-message', AiController.generateLinkedInMessage);

export default router;
