import { Request, Response } from 'express';
import { DbService } from '../services/supabase.service';
import { AiService } from '../services/ai.service';

export class CompaniesController {
  static async getCompanies(req: Request, res: Response) {
    const userId = req.user!.userId;
    const companies = await DbService.findMany('companies', { user_id: userId }, { orderBy: 'created_at', ascending: false });

    // Attach contacts_count and jobs_count
    const contacts = await DbService.findMany('contacts', { user_id: userId });
    const jobs = await DbService.findMany('jobs', { user_id: userId });

    const enriched = companies.map((comp) => {
      const contactsCount = contacts.filter((c) => (c.company || '').toLowerCase() === comp.name.toLowerCase()).length;
      const jobsCount = jobs.filter((j) => j.company_id === comp.id).length;
      return {
        ...comp,
        contacts_count: contactsCount,
        jobs_count: jobsCount,
      };
    });

    return res.json({ success: true, companies: enriched });
  }

  static async createCompany(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { name, website, careers_url, industry, location, size, funding_stage, notes, tags } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Company name is required.' });
    }

    const company = await DbService.insert('companies', {
      user_id: userId,
      name,
      website: website || '',
      careers_url: careers_url || '',
      industry: industry || '',
      location: location || '',
      size: size || '',
      funding_stage: funding_stage || '',
      recent_news: [],
      notes: notes || '',
      tags: tags || [],
    });

    return res.status(201).json({ success: true, company });
  }

  static async getCompanyById(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { id } = req.params;

    const company = await DbService.findById('companies', id, userId);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }

    // Get linked contacts & jobs
    const contacts = await DbService.findMany('contacts', { user_id: userId });
    const linkedContacts = contacts.filter((c) => (c.company || '').toLowerCase() === company.name.toLowerCase());
    const linkedJobs = await DbService.findMany('jobs', { user_id: userId, company_id: id });

    return res.json({
      success: true,
      company,
      contacts: linkedContacts,
      jobs: linkedJobs,
    });
  }

  static async updateCompany(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { id } = req.params;
    const updates = req.body;

    delete updates.id;
    delete updates.user_id;

    const updated = await DbService.update('companies', { id, user_id: userId }, updates);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }

    return res.json({ success: true, company: updated });
  }

  static async deleteCompany(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { id } = req.params;

    const deleted = await DbService.delete('companies', { id, user_id: userId });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }

    return res.json({ success: true, message: 'Company deleted.' });
  }

  static async researchCompany(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { id } = req.params;

    const company = await DbService.findById('companies', id, userId);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }

    const research = await AiService.researchCompany(company.name, company.website);

    // Save recent news if empty
    if ((!company.recent_news || company.recent_news.length === 0) && research.recentNews.length > 0) {
      await DbService.update('companies', { id, user_id: userId }, {
        recent_news: research.recentNews,
        size: company.size || research.estimatedSize,
        funding_stage: company.funding_stage || research.fundingStage,
      });
    }

    return res.json({ success: true, research });
  }
}
