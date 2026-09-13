import { Request, Response } from 'express';
import { DbService } from '../services/supabase.service';
import { ResumeService } from '../services/resume.service';
import { ENV } from '../config/env';

export class ProfileController {
  static async getProfile(req: Request, res: Response) {
    const userId = req.user!.userId;
    let profile = await DbService.findOne('profiles', { user_id: userId });

    if (!profile) {
      const user = await DbService.findById('users', userId);
      profile = await DbService.insert('profiles', {
        user_id: userId,
        full_name: user?.name || '',
        email: user?.email || '',
        headline: 'Software Engineer',
        skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
        experience: [],
        projects: [],
        achievements: [],
        certifications: [],
        technologies: ['React', 'TypeScript', 'Node.js'],
        email_signature: {
          name: user?.name || '',
          title: 'Software Engineer',
          email: user?.email || '',
          phone: '',
          linkedin: '',
          github: '',
          portfolio: '',
          layout: 'standard',
        },
      });
    }

    return res.json({ success: true, profile });
  }

  static async updateProfile(req: Request, res: Response) {
    const userId = req.user!.userId;
    const updates = req.body;

    // Disallow altering user_id or id
    delete updates.id;
    delete updates.user_id;

    let profile = await DbService.findOne('profiles', { user_id: userId });
    if (!profile) {
      profile = await DbService.insert('profiles', {
        user_id: userId,
        ...updates,
      });
    } else {
      profile = await DbService.update('profiles', { user_id: userId }, updates);
    }

    return res.json({ success: true, profile });
  }

  static async uploadResume(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ success: false, message: 'No file uploaded.' });
      }

      // Check max size 5MB
      if (file.size > ENV.MAX_UPLOAD_SIZE_MB * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: `File exceeds maximum allowed size of ${ENV.MAX_UPLOAD_SIZE_MB}MB.`,
        });
      }

      // Validate MIME type
      const allowedMimes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
      ];
      if (!allowedMimes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid file format. Only PDF and DOCX files are allowed.',
        });
      }

      // Extract raw text
      const rawText = await ResumeService.extractText(file.buffer, file.mimetype);

      // Parse structured data
      const parsedData = await ResumeService.parseStructured(rawText);

      // Save file to storage
      const ext = file.originalname.split('.').pop() || 'pdf';
      const storagePath = `${userId}/${Date.now()}_resume.${ext}`;
      const fileUrl = await DbService.uploadFile(
        ENV.SUPABASE_STORAGE_BUCKET,
        storagePath,
        file.buffer,
        file.mimetype
      );

      return res.json({
        success: true,
        extracted: parsedData,
        fileUrl,
        fileName: file.originalname,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getResumeVersions(req: Request, res: Response) {
    const userId = req.user!.userId;
    const versions = await DbService.findMany(
      'resume_versions',
      { user_id: userId },
      { orderBy: 'created_at', ascending: false }
    );
    return res.json({ success: true, versions });
  }

  static async createResumeVersion(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { name, fileUrl, parsedData, isDefault } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Resume version name is required.' });
    }

    if (isDefault) {
      // Unset previous defaults
      const existing = await DbService.findMany('resume_versions', { user_id: userId, is_default: true });
      for (const ver of existing) {
        await DbService.update('resume_versions', { id: ver.id, user_id: userId }, { is_default: false });
      }
    }

    const version = await DbService.insert('resume_versions', {
      user_id: userId,
      name,
      file_url: fileUrl || null,
      parsed_data: parsedData || {},
      is_default: Boolean(isDefault),
    });

    if (isDefault) {
      await DbService.update('profiles', { user_id: userId }, {
        active_resume_version_id: version.id,
      });
    }

    return res.status(201).json({ success: true, version });
  }

  static async setDefaultResumeVersion(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { id } = req.params;

    const existing = await DbService.findMany('resume_versions', { user_id: userId, is_default: true });
    for (const ver of existing) {
      await DbService.update('resume_versions', { id: ver.id, user_id: userId }, { is_default: false });
    }

    const updated = await DbService.update('resume_versions', { id, user_id: userId }, { is_default: true });
    await DbService.update('profiles', { user_id: userId }, { active_resume_version_id: id });

    return res.json({ success: true, version: updated });
  }

  static async deleteResumeVersion(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { id } = req.params;

    const version = await DbService.findById('resume_versions', id, userId);
    if (!version) {
      return res.status(404).json({ success: false, message: 'Resume version not found.' });
    }

    // Delete storage file if path exists
    if (version.file_url) {
      try {
        const filePath = version.file_url.split('/').slice(-2).join('/');
        await DbService.deleteFile(ENV.SUPABASE_STORAGE_BUCKET, filePath);
      } catch (e) {
        console.warn('Could not delete storage file:', e);
      }
    }

    await DbService.delete('resume_versions', { id, user_id: userId });
    return res.json({ success: true, message: 'Resume version deleted.' });
  }

  static async updateSignature(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { email_signature } = req.body;

    const updated = await DbService.update('profiles', { user_id: userId }, { email_signature });
    return res.json({ success: true, signature: updated?.email_signature });
  }

  static async updateVoiceProfile(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { voice_profile } = req.body;

    const updated = await DbService.update('profiles', { user_id: userId }, { voice_profile });
    return res.json({ success: true, voiceProfile: updated?.voice_profile });
  }
}
