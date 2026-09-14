import { Request, Response } from 'express';
import { AiService } from '../services/ai.service';
import { DbService } from '../services/supabase.service';

export class AiController {
  static async generateEmail(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const {
        resumeVersionId,
        companyId,
        contactId,
        jobId,
        personalNote,
        tone = 'Balanced',
        length = 'Standard',
        language = 'en',
        type = 'cold-email',
        referralRelation,
        interviewerName,
        interviewDate,
        interviewNotes,
        confirmedCollege,
      } = req.body;

      // Fetch user and profile
      const [profile, user] = await Promise.all([
        DbService.findOne('profiles', { user_id: userId }),
        DbService.findById('users', userId),
      ]);

      const effectiveProfile = {
        ...(profile || {}),
        full_name: profile?.full_name || user?.name || 'Job Seeker',
        skills: Array.isArray(profile?.skills) && profile.skills.length > 0
          ? profile.skills
          : ['React', 'TypeScript', 'Node.js', 'System Design'],
      };

      // Fetch resume if specified
      let resume = null;
      if (resumeVersionId) {
        resume = await DbService.findById('resume_versions', resumeVersionId, userId);
      } else if (profile?.active_resume_version_id) {
        resume = await DbService.findById('resume_versions', profile.active_resume_version_id, userId);
      }

      const contact = contactId ? await DbService.findById('contacts', contactId, userId) : null;
      const job = jobId ? await DbService.findById('jobs', jobId, userId) : null;

      // Fetch or resolve company
      let company = companyId ? await DbService.findById('companies', companyId, userId) : null;
      const manualCompName = (req.body.companyName || req.body.company || contact?.company || job?.company?.name || '').trim();
      if (!company && manualCompName) {
        company = await DbService.findOne('companies', { user_id: userId, name: manualCompName });
        if (!company) {
          company = await DbService.insert('companies', {
            user_id: userId,
            name: manualCompName,
            website: '',
            industry: 'Technology',
          });
        }
      }

      // Handle type fallbacks smoothly
      const effectiveReferral = referralRelation || (type === 'referral' ? 'our shared professional network' : undefined);
      const effectiveCollege = confirmedCollege || profile?.university || (type === 'alumni' ? 'our alma mater' : undefined);

      const generated = await AiService.generateEmail({
        profile: effectiveProfile,
        resume,
        company,
        contact,
        job,
        personalNote,
        tone,
        length,
        language,
        type,
        voiceProfile: profile?.voice_profile,
        referralRelation: effectiveReferral,
        interviewerName,
        interviewDate,
        interviewNotes,
        confirmedCollege: effectiveCollege,
      });

      return res.json({ success: true, ...generated });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static async scoreEmail(req: Request, res: Response) {
    try {
      const { subject = '', body = '', company } = req.body;
      const score = await AiService.scoreEmail(subject, body, { company });
      return res.json({ success: true, score });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static async checkEmail(req: Request, res: Response) {
    return AiController.scoreEmail(req, res);
  }

  static async ghostwrite(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { samples } = req.body;

      if (!Array.isArray(samples) || samples.length === 0) {
        return res.status(400).json({ success: false, message: 'Please provide 1-5 sample emails you have written.' });
      }

      const analyzed = await AiService.analyzeWritingStyle(samples);

      // Save directly to profile
      await DbService.update('profiles', { user_id: userId }, {
        voice_profile: analyzed.voiceProfile,
      });

      return res.json({ success: true, ...analyzed });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  static async summarizeJd(req: Request, res: Response) {
    try {
      const { description, title, company } = req.body;
      if (!description || description.length < 50) {
        return res.status(400).json({ success: false, message: 'Description must be at least 50 characters.' });
      }

      const summary = await AiService.summarizeJd(description, title, company);
      return res.json({ success: true, summary });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static async suggestSubjectLines(req: Request, res: Response) {
    try {
      const { candidateName = 'Job Seeker', roleTitle = 'Software Engineer', company = 'Company', angle = 'impact' } = req.body;
      const suggestions = await AiService.suggestSubjectLines(candidateName, roleTitle, company, angle);
      return res.json({ success: true, suggestions });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static async researchCompany(req: Request, res: Response) {
    try {
      const { companyName, website } = req.body;
      if (!companyName) {
        return res.status(400).json({ success: false, message: 'Company name is required.' });
      }
      const research = await AiService.researchCompany(companyName, website);
      return res.json({ success: true, research });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static async generateLinkedInMessage(req: Request, res: Response) {
    try {
      const { contactName, company, roleTitle, candidateName, topSkill } = req.body;
      if (!contactName || !company) {
        return res.status(400).json({ success: false, message: 'Contact name and company are required.' });
      }
      const result = await AiService.generateLinkedInMessage({
        contactName,
        company,
        roleTitle: roleTitle || 'Software Engineer',
        candidateName: candidateName || 'Candidate',
        topSkill,
      });
      return res.json({ success: true, ...result });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}
