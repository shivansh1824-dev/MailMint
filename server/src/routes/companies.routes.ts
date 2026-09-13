import { Router } from 'express';
import { CompaniesController } from '../controllers/companies.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', CompaniesController.getCompanies);
router.post('/', CompaniesController.createCompany);
router.get('/:id', CompaniesController.getCompanyById);
router.put('/:id', CompaniesController.updateCompany);
router.delete('/:id', CompaniesController.deleteCompany);
router.get('/:id/research', CompaniesController.researchCompany);

export default router;
