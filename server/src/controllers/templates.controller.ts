import { Request, Response } from 'express';
import { DbService } from '../services/supabase.service';

export class TemplatesController {
  static async getTemplates(req: Request, res: Response) {
    const userId = req.user!.userId;
    const templates = await DbService.findMany(
      'templates',
      { user_id: userId },
      { orderBy: 'created_at', ascending: false }
    );
    return res.json({ success: true, templates });
  }

  static async createTemplate(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { name, category = 'recruiter', subject, body, variables = [], language = 'en', is_default = false } = req.body;

    if (!name || !subject || !body) {
      return res.status(400).json({ success: false, message: 'Name, subject, and body are required.' });
    }

    // Auto-detect variables like {{company}}, {{firstName}}
    const detectedVars = (body.match(/\{\{([a-zA-Z0-9_]+)\}\}/g) || []).map((v: string) =>
      v.replace(/[\{\}]/g, '')
    );
    const mergedVars = Array.from(new Set([...variables, ...detectedVars]));

    const template = await DbService.insert('templates', {
      user_id: userId,
      name,
      category,
      subject,
      body,
      variables: mergedVars,
      language,
      is_default,
      is_public: false,
    });

    return res.status(201).json({ success: true, template });
  }

  static async getTemplateById(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { id } = req.params;

    // Check user owned or public
    let template = await DbService.findOne('templates', { id, user_id: userId });
    if (!template) {
      template = await DbService.findOne('templates', { id, is_public: true });
    }

    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found.' });
    }

    return res.json({ success: true, template });
  }

  static async updateTemplate(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { id } = req.params;
    const updates = req.body;

    delete updates.id;
    delete updates.user_id;

    const updated = await DbService.update('templates', { id, user_id: userId }, updates);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Template not found.' });
    }

    return res.json({ success: true, template: updated });
  }

  static async deleteTemplate(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { id } = req.params;

    const template = await DbService.findById('templates', id, userId);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found.' });
    }

    if (template.is_public) {
      // Rule: Published templates cannot be deleted; they can only be unpublished
      await DbService.update('templates', { id, user_id: userId }, { is_public: false });
      return res.json({ success: true, message: 'Template unpublished from marketplace.' });
    }

    await DbService.delete('templates', { id, user_id: userId });
    return res.json({ success: true, message: 'Template deleted.' });
  }

  static async duplicateTemplate(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { id } = req.params;

    const source = await DbService.findById('templates', id);
    if (!source) {
      return res.status(404).json({ success: false, message: 'Template not found.' });
    }

    const copy = await DbService.insert('templates', {
      user_id: userId,
      name: `${source.name} (Copy)`,
      category: source.category,
      subject: source.subject,
      body: source.body,
      variables: source.variables || [],
      language: source.language || 'en',
      is_default: false,
      is_public: false,
    });

    return res.status(201).json({ success: true, template: copy });
  }

  static async getMarketplace(req: Request, res: Response) {
    const { category, search } = req.query as Record<string, string>;

    const query: Record<string, any> = { is_public: true };
    if (category && category !== 'all') {
      query.category = category;
    }

    let templates = await DbService.findMany('templates', query, { orderBy: 'usage_count', ascending: false });

    if (search && search.trim()) {
      const q = search.toLowerCase();
      templates = templates.filter(
        (t) =>
          t.name?.toLowerCase().includes(q) ||
          t.subject?.toLowerCase().includes(q) ||
          t.category?.toLowerCase().includes(q)
      );
    }

    return res.json({ success: true, templates });
  }

  static async publishTemplate(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { authorAlias } = req.body;

    if (!authorAlias) {
      return res.status(400).json({ success: false, message: 'An author alias is required to publish anonymously.' });
    }

    const updated = await DbService.update('templates', { id, user_id: userId }, {
      is_public: true,
      author_alias: authorAlias,
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Template not found.' });
    }

    return res.json({ success: true, template: updated });
  }

  static async importTemplate(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { id } = req.params;

    const source = await DbService.findById('templates', id);
    if (!source || !source.is_public) {
      return res.status(404).json({ success: false, message: 'Marketplace template not found.' });
    }

    // Increment usage count on marketplace template
    await DbService.update('templates', { id: source.id }, {
      usage_count: (source.usage_count || 0) + 1,
    });

    // Create user copy
    const imported = await DbService.insert('templates', {
      user_id: userId,
      name: source.name,
      category: source.category,
      subject: source.subject,
      body: source.body,
      variables: source.variables || [],
      language: source.language || 'en',
      is_default: false,
      is_public: false,
      author_alias: null,
    });

    return res.status(201).json({ success: true, template: imported });
  }
}
