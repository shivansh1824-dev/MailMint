import { Request, Response } from 'express';
import { DbService } from '../services/supabase.service';
import { GmailService } from '../services/gmail.service';

export class FollowupsController {
  static async getFollowups(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { status } = req.query as Record<string, string>;

    const query: Record<string, any> = { user_id: userId };
    if (status) query.status = status;

    const followups = await DbService.findMany('follow_ups', query, { orderBy: 'created_at', ascending: false });

    // Enrich with email and contact
    const contacts = await DbService.findMany('contacts', { user_id: userId });
    const contactMap = new Map(contacts.map((c) => [c.id, c]));

    const emails = await DbService.findMany('emails', { user_id: userId });
    const emailMap = new Map(emails.map((e) => [e.id, e]));

    const enriched = followups.map((f) => ({
      ...f,
      contact: contactMap.get(f.contact_id) || null,
      email: emailMap.get(f.email_id) || null,
    }));

    return res.json({ success: true, followups: enriched });
  }

  static async createFollowup(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { email_id, contact_id, campaign_id, day_offset = 3, scheduled_at } = req.body;

    if (!email_id || !contact_id) {
      return res.status(400).json({ success: false, message: 'Email ID and Contact ID are required.' });
    }

    const scheduledDate = scheduled_at || new Date(Date.now() + day_offset * 86400000).toISOString();

    const followup = await DbService.insert('follow_ups', {
      user_id: userId,
      email_id,
      contact_id,
      campaign_id: campaign_id || null,
      day_offset,
      status: 'pending-approval',
      scheduled_at: scheduledDate,
      approved_by_user: false,
    });

    return res.status(201).json({ success: true, followup });
  }

  static async updateFollowup(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { id } = req.params;
    const updates = req.body;

    delete updates.id;
    delete updates.user_id;

    const updated = await DbService.update('follow_ups', { id, user_id: userId }, updates);
    return res.json({ success: true, followup: updated });
  }

  static async approveFollowup(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      const followup = await DbService.findById('follow_ups', id, userId);
      if (!followup) {
        return res.status(404).json({ success: false, message: 'Follow-up not found.' });
      }

      const email = await DbService.findById('emails', followup.email_id, userId);
      const contact = await DbService.findById('contacts', followup.contact_id, userId);

      if (!contact || !contact.email) {
        return res.status(400).json({ success: false, message: 'Contact email is missing.' });
      }

      // Send follow-up email
      const subject = `Following up: ${email?.subject || 'Our previous conversation'}`;
      const body = `Hi ${contact.name.split(' ')[0]},\n\nI wanted to briefly follow up on my previous note regarding the team at ${contact.company || 'your company'}. I understand things get busy, but I remain very enthusiastic about contributing.\n\nPlease let me know if you have a few minutes for a brief call.\n\nBest regards.`;

      const sendResult = await GmailService.sendEmail(userId, contact.email, subject, body);

      const updated = await DbService.update('follow_ups', { id, user_id: userId }, {
        status: 'sent',
        approved_by_user: true,
        sent_at: new Date().toISOString(),
      });

      await DbService.update('contacts', { id: contact.id, user_id: userId }, {
        status: 'follow-up',
        last_contacted: new Date().toISOString(),
      });

      await DbService.insert('contact_timeline', {
        user_id: userId,
        contact_id: contact.id,
        action: 'follow-up-sent',
        description: `Follow-up sent: "${subject}"`,
      });

      return res.json({ success: true, followup: updated, sendResult });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static async cancelFollowup(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { id } = req.params;

    const updated = await DbService.update('follow_ups', { id, user_id: userId }, {
      status: 'cancelled',
    });

    return res.json({ success: true, followup: updated });
  }
}
