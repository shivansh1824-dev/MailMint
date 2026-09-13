import { Request, Response } from 'express';
import { DbService } from '../services/supabase.service';

export class ContactsController {
  static async getContacts(req: Request, res: Response) {
    const userId = req.user!.userId;
    const {
      search,
      status,
      includeSnoozed,
      page = '1',
      limit = '25',
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = req.query as Record<string, string>;

    const query: Record<string, any> = { user_id: userId };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (includeSnoozed !== 'true' && status !== 'snoozed') {
      query.is_snoozed = false;
    }

    let allContacts = await DbService.findMany('contacts', query, {
      orderBy: sortBy,
      ascending: sortOrder === 'asc',
    });

    // Apply search filter if present
    if (search && search.trim()) {
      const q = search.toLowerCase();
      allContacts = allContacts.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.company?.toLowerCase().includes(q) ||
          c.job_title?.toLowerCase().includes(q)
      );
    }

    const total = allContacts.length;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 25;
    const offset = (pageNum - 1) * limitNum;
    const paginated = allContacts.slice(offset, offset + limitNum);

    return res.json({
      success: true,
      contacts: paginated,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  }

  static async createContact(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { name, company, job_title, email, linkedin_url, source = 'manual', source_url, notes, tags, timezone } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Contact name is required.' });
    }

    const contact = await DbService.insert('contacts', {
      user_id: userId,
      name,
      company: company || '',
      job_title: job_title || '',
      email: email || '',
      linkedin_url: linkedin_url || '',
      source,
      source_url: source_url || '',
      notes: notes || '',
      tags: tags || [],
      status: 'new',
      timezone: timezone || 'UTC',
      is_snoozed: false,
    });

    await DbService.insert('contact_timeline', {
      user_id: userId,
      contact_id: contact.id,
      action: 'note',
      description: `Contact added (${source})`,
    });

    return res.status(201).json({ success: true, contact });
  }

  static async getContactById(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { id } = req.params;

    const contact = await DbService.findById('contacts', id, userId);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found.' });
    }

    const timeline = await DbService.findMany(
      'contact_timeline',
      { contact_id: id, user_id: userId },
      { orderBy: 'created_at', ascending: false }
    );

    const emails = await DbService.findMany(
      'emails',
      { contact_id: id, user_id: userId },
      { orderBy: 'created_at', ascending: false }
    );

    return res.json({ success: true, contact, timeline, emails });
  }

  static async updateContact(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { id } = req.params;
    const updates = req.body;

    delete updates.id;
    delete updates.user_id;

    const oldContact = await DbService.findById('contacts', id, userId);
    if (!oldContact) {
      return res.status(404).json({ success: false, message: 'Contact not found.' });
    }

    const updated = await DbService.update('contacts', { id, user_id: userId }, updates);

    if (updates.status && updates.status !== oldContact.status) {
      await DbService.insert('contact_timeline', {
        user_id: userId,
        contact_id: id,
        action: 'status-changed',
        description: `Status changed from ${oldContact.status} to ${updates.status}`,
      });
    }

    return res.json({ success: true, contact: updated });
  }

  static async deleteContact(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { id } = req.params;

    const deleted = await DbService.delete('contacts', { id, user_id: userId });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Contact not found.' });
    }

    await DbService.delete('contact_timeline', { contact_id: id, user_id: userId });
    return res.json({ success: true, message: 'Contact deleted successfully.' });
  }

  static async importContacts(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { contacts } = req.body;

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({ success: false, message: 'No contacts provided for import.' });
    }

    const existingContacts = await DbService.findMany('contacts', { user_id: userId });
    const existingEmails = new Set(existingContacts.map((c) => c.email?.toLowerCase()).filter(Boolean));

    let importedCount = 0;
    const skippedDuplicates: string[] = [];

    for (const item of contacts) {
      const email = (item.email || '').trim().toLowerCase();
      if (email && existingEmails.has(email)) {
        skippedDuplicates.push(email);
        continue;
      }

      await DbService.insert('contacts', {
        user_id: userId,
        name: item.name || 'Unknown Contact',
        company: item.company || '',
        job_title: item.job_title || item.role || '',
        email: item.email || '',
        linkedin_url: item.linkedin || item.linkedin_url || '',
        source: item.source || 'csv-import',
        source_url: item.sourceUrl || '',
        notes: item.notes || '',
        tags: item.tags || ['imported'],
        status: 'new',
        is_snoozed: false,
      });

      if (email) existingEmails.add(email);
      importedCount++;
    }

    return res.json({
      success: true,
      importedCount,
      skippedCount: skippedDuplicates.length,
      skippedDuplicates,
    });
  }

  static async bulkAction(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { ids, action, payload } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No contact IDs specified.' });
    }

    let affected = 0;
    if (action === 'delete') {
      for (const id of ids) {
        const del = await DbService.delete('contacts', { id, user_id: userId });
        if (del) affected++;
      }
    } else if (action === 'update-status') {
      for (const id of ids) {
        await DbService.update('contacts', { id, user_id: userId }, { status: payload.status });
        affected++;
      }
    } else if (action === 'add-tag') {
      for (const id of ids) {
        const contact = await DbService.findById('contacts', id, userId);
        if (contact) {
          const tags = Array.from(new Set([...(contact.tags || []), payload.tag]));
          await DbService.update('contacts', { id, user_id: userId }, { tags });
          affected++;
        }
      }
    } else if (action === 'snooze') {
      const snoozedUntil = payload.snoozedUntil || new Date(Date.now() + 7 * 86400000).toISOString();
      for (const id of ids) {
        await DbService.update('contacts', { id, user_id: userId }, {
          is_snoozed: true,
          snoozed_until: snoozedUntil,
          status: 'snoozed',
        });
        await DbService.insert('contact_timeline', {
          user_id: userId,
          contact_id: id,
          action: 'snoozed',
          description: `Bulk snoozed until ${new Date(snoozedUntil).toLocaleDateString()}`,
        });
        affected++;
      }
    }

    return res.json({ success: true, affectedCount: affected });
  }

  static async snooze(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { duration, customDate } = req.body;

    let targetDate = new Date();
    if (duration === '3days') {
      targetDate.setDate(targetDate.getDate() + 3);
    } else if (duration === '1week') {
      targetDate.setDate(targetDate.getDate() + 7);
    } else if (duration === '2weeks') {
      targetDate.setDate(targetDate.getDate() + 14);
    } else if (customDate) {
      targetDate = new Date(customDate);
    } else {
      targetDate.setDate(targetDate.getDate() + 7);
    }

    const snoozedUntil = targetDate.toISOString();

    const contact = await DbService.update('contacts', { id, user_id: userId }, {
      is_snoozed: true,
      snoozed_until: snoozedUntil,
      status: 'snoozed',
    });

    await DbService.insert('contact_timeline', {
      user_id: userId,
      contact_id: id,
      action: 'snoozed',
      description: `Snoozed until ${targetDate.toLocaleDateString()}`,
    });

    return res.json({ success: true, contact, snoozedUntil });
  }

  static async unsnooze(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { id } = req.params;

    const contact = await DbService.update('contacts', { id, user_id: userId }, {
      is_snoozed: false,
      snoozed_until: null,
      status: 'new',
    });

    await DbService.insert('contact_timeline', {
      user_id: userId,
      contact_id: id,
      action: 'status-changed',
      description: `Contact manually unsnoozed.`,
    });

    return res.json({ success: true, contact });
  }

  static async getTimeline(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { id } = req.params;

    const timeline = await DbService.findMany(
      'contact_timeline',
      { contact_id: id, user_id: userId },
      { orderBy: 'created_at', ascending: false }
    );

    return res.json({ success: true, timeline });
  }

  static async addTimelineEntry(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { action = 'note', description } = req.body;

    if (!description) {
      return res.status(400).json({ success: false, message: 'Description is required.' });
    }

    const entry = await DbService.insert('contact_timeline', {
      user_id: userId,
      contact_id: id,
      action,
      description,
    });

    return res.status(201).json({ success: true, entry });
  }
}
