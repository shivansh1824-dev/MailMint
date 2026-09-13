import { Router } from 'express';
import { CampaignsController } from '../controllers/campaigns.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', CampaignsController.getCampaigns);
router.post('/', CampaignsController.createCampaign);
router.get('/:id', CampaignsController.getCampaignById);
router.put('/:id', CampaignsController.updateCampaign);
router.delete('/:id', CampaignsController.deleteCampaign);
router.post('/:id/pause', CampaignsController.pauseCampaign);
router.post('/:id/resume', CampaignsController.resumeCampaign);
router.get('/:id/stats', CampaignsController.getStats);

export default router;
