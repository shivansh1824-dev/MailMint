import { Request, Response } from 'express';
import { DbService } from '../services/supabase.service';

export class ApplicationsController {
  static async getApplications(req: Request, res: Response) {
    const userId = req.user!.userId;
    const applications = await DbService.findMany('applications', { user_id: userId }, { orderBy: 'created_at', ascending: false });

    const jobs = await DbService.findMany('jobs', { user_id: userId });
    const jobMap = new Map(jobs.map((j) => [j.id, j]));

    const companies = await DbService.findMany('companies', { user_id: userId });
    const companyMap = new Map(companies.map((c) => [c.id, c]));

    const contacts = await DbService.findMany('contacts', { user_id: userId });
    const contactMap = new Map(contacts.map((c) => [c.id, c]));

    const enriched = applications.map((app) => {
      const job = app.job_id ? jobMap.get(app.job_id) : null;
      const company = job?.company_id ? companyMap.get(job.company_id) : null;
      const contact = app.contact_id ? contactMap.get(app.contact_id) : null;

      return {
        ...app,
        job: job || null,
        company: company || null,
        contact: contact || null,
      };
    });

    return res.json({ success: true, applications: enriched });
  }

  static async createApplication(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { job_id, contact_id, applied_via = 'portal', applied_date, status = 'applied', notes, interview_dates, referral_from } = req.body;

    const application = await DbService.insert('applications', {
      user_id: userId,
      job_id: job_id || null,
      contact_id: contact_id || null,
      applied_via,
      applied_date: applied_date || new Date().toISOString().split('T')[0],
      status,
      notes: notes || '',
      interview_dates: interview_dates || [],
      referral_from: referral_from || '',
    });

    return res.status(201).json({ success: true, application });
  }

  static async updateApplication(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { id } = req.params;
    const updates = req.body;

    delete updates.id;
    delete updates.user_id;

    const updated = await DbService.update('applications', { id, user_id: userId }, updates);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    return res.json({ success: true, application: updated });
  }

  static async deleteApplication(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { id } = req.params;

    const deleted = await DbService.delete('applications', { id, user_id: userId });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    return res.json({ success: true, message: 'Application deleted.' });
  }
}
