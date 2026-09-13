import { Request, Response } from 'express';
import { DbService } from '../services/supabase.service';
import { AiService } from '../services/ai.service';

export class JobsController {
  static async getJobs(req: Request, res: Response) {
    const userId = req.user!.userId;
    const jobs = await DbService.findMany('jobs', { user_id: userId }, { orderBy: 'created_at', ascending: false });

    // Attach company details
    const companies = await DbService.findMany('companies', { user_id: userId });
    const companyMap = new Map(companies.map((c) => [c.id, c]));

    const enriched = jobs.map((job) => ({
      ...job,
      company: job.company_id ? companyMap.get(job.company_id) || null : null,
    }));

    return res.json({ success: true, jobs: enriched });
  }

  static async createJob(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { company_id, company_name, company: compNameInput, title, url, description, location, employment_type, skills, analyzed_data, source = 'manual' } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Job title is required.' });
    }

    let resolvedCompanyId = company_id || null;
    const manualCompanyName = (company_name || compNameInput || '').trim();

    if (!resolvedCompanyId && manualCompanyName) {
      let existingComp = await DbService.findOne('companies', { user_id: userId, name: manualCompanyName });
      if (!existingComp) {
        existingComp = await DbService.insert('companies', {
          user_id: userId,
          name: manualCompanyName,
          website: '',
          industry: 'Technology',
          notes: 'Auto-created from target job',
        });
      }
      if (existingComp) {
        resolvedCompanyId = existingComp.id;
      }
    }

    const job = await DbService.insert('jobs', {
      user_id: userId,
      company_id: resolvedCompanyId,
      title,
      url: url || '',
      description: description || '',
      location: location || '',
      employment_type: employment_type || 'Full-time',
      skills: skills || [],
      analyzed_data: analyzed_data || null,
      status: 'saved',
      source,
    });

    return res.status(201).json({ success: true, job });
  }

  static async getJobById(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { id } = req.params;

    const job = await DbService.findById('jobs', id, userId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    const company = job.company_id ? await DbService.findById('companies', job.company_id, userId) : null;
    return res.json({ success: true, job: { ...job, company } });
  }

  static async updateJob(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { id } = req.params;
    const updates = req.body;

    delete updates.id;
    delete updates.user_id;

    const updated = await DbService.update('jobs', { id, user_id: userId }, updates);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    return res.json({ success: true, job: updated });
  }

  static async deleteJob(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { id } = req.params;

    const deleted = await DbService.delete('jobs', { id, user_id: userId });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    return res.json({ success: true, message: 'Job deleted.' });
  }

  static async analyzeJobDescription(req: Request, res: Response) {
    const { description, title, company } = req.body;

    if (!description || description.trim().length < 50) {
      return res.status(400).json({ success: false, message: 'Job description must have at least 50 characters to analyze.' });
    }

    const analyzed = await AiService.summarizeJd(description, title, company);
    return res.json({ success: true, analyzed });
  }

  static async importLinkedInJob(req: Request, res: Response) {
    const { url } = req.body;

    if (!url || !url.includes('linkedin.com')) {
      return res.status(400).json({ success: false, message: 'Please provide a valid LinkedIn job URL.' });
    }

    // Extract potential job ID from URL
    const idMatch = url.match(/currentJobId=(\d+)|jobs\/view\/(\d+)/);
    const linkedinJobId = idMatch ? (idMatch[1] || idMatch[2]) : `li_${Date.now()}`;

    try {
      // Attempt public fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      // If page is behind auth wall or 404
      if (!response.ok || response.status === 403 || response.status === 999) {
        return res.status(200).json({
          success: false,
          fallbackRequired: true,
          message: 'This job posting is no longer public or requires LinkedIn login. Please paste the job description manually.',
          linkedinJobId,
        });
      }

      const html = await response.text();
      // Extract title from html if possible
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      const rawTitle = titleMatch ? titleMatch[1].replace(/\|.*$/i, '').trim() : 'Software Engineer';

      return res.json({
        success: true,
        extracted: {
          title: rawTitle,
          company: '',
          location: 'Remote / US',
          employment_type: 'Full-time',
          description: '',
          linkedin_job_id: linkedinJobId,
          source: 'linkedin-import',
        },
      });
    } catch {
      return res.json({
        success: false,
        fallbackRequired: true,
        message: 'This job posting is no longer public or requires LinkedIn login. Please paste the job description manually.',
        linkedinJobId,
      });
    }
  }
}
