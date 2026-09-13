import { Router } from 'express';
import multer from 'multer';
import { ProfileController } from '../controllers/profile.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

router.use(requireAuth);

router.get('/', ProfileController.getProfile);
router.put('/', ProfileController.updateProfile);
router.post('/resume/upload', upload.single('resume'), ProfileController.uploadResume);
router.get('/resume/versions', ProfileController.getResumeVersions);
router.post('/resume/versions', ProfileController.createResumeVersion);
router.put('/resume/versions/:id/set-default', ProfileController.setDefaultResumeVersion);
router.delete('/resume/versions/:id', ProfileController.deleteResumeVersion);
router.put('/signature', ProfileController.updateSignature);
router.put('/voice-profile', ProfileController.updateVoiceProfile);

export default router;
