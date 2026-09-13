import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/overview', AnalyticsController.getOverview);
router.get('/emails-over-time', AnalyticsController.getEmailsOverTime);
router.get('/reply-rate', AnalyticsController.getReplyRate);
router.get('/campaigns', AnalyticsController.getCampaigns);
router.get('/companies', AnalyticsController.getCompanies);
router.get('/ab-test/:campaignId', AnalyticsController.getAbTest);
router.get('/skills-gap', AnalyticsController.getSkillsGap);
router.get('/response-by-industry', AnalyticsController.getResponseByIndustry);

export default router;
