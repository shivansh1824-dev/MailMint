import { Request, Response } from 'express';
import { DbService } from '../services/supabase.service';
import { GmailService } from '../services/gmail.service';
import { ResendService } from '../services/resend.service';
import { AiService } from '../services/ai.service';
import { ENV } from '../config/env';

export class EmailsController {
  static async getEmails(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { status, campaignId, contactId } = req.query as Record<string, string>;

    const query: Record<string, any> = { user_id: userId };
    if (status) query.status = status;
    if (campaignId) query.campaign_id = campaignId;
    if (contactId) query.contact_id = contactId;

    const emails = await DbService.findMany('emails', query, { orderBy: 'created_at', ascending: false });

    // Enrich with contact and job
    const contacts = await DbService.findMany('contacts', { user_id: userId });
    const contactMap = new Map(contacts.map((c) => [c.id, c]));

    const jobs = await DbService.findMany('jobs', { user_id: userId });
    const jobMap = new Map(jobs.map((j) => [j.id, j]));

    const enriched = emails.map((e) => ({
      ...e,
      contact: e.contact_id ? contactMap.get(e.contact_id) || null : null,
      job: e.job_id ? jobMap.get(e.job_id) || null : null,
    }));

    return res.json({ success: true, emails: enriched });
  }

  static async createEmail(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { contact_id, job_id, campaign_id, type = 'cold-email', subject, body, generated_by, language = 'en', ab_variant, quality_score } = req.body;

    const email = await DbService.insert('emails', {
      user_id: userId,
      contact_id: contact_id || null,
      job_id: job_id || null,
      campaign_id: campaign_id || null,
      type,
      subject: subject || 'Outreach',
      body: body || '',
      generated_by: generated_by || null,
      status: 'draft',
      language,
      ab_variant: ab_variant || null,
      quality_score: quality_score || null,
    });

    if (contact_id) {
      await DbService.insert('contact_timeline', {
        user_id: userId,
        contact_id,
        action: 'drafted',
        description: `Draft created: "${subject || 'Untitled'}"`,
      });
    }

    return res.status(201).json({ success: true, email });
  }

  static async getEmailById(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { id } = req.params;

    const email = await DbService.findById('emails', id, userId);
    if (!email) {
      return res.status(404).json({ success: false, message: 'Email not found.' });
    }

    const contact = email.contact_id ? await DbService.findById('contacts', email.contact_id, userId) : null;
    const job = email.job_id ? await DbService.findById('jobs', email.job_id, userId) : null;

    return res.json({ success: true, email: { ...email, contact, job } });
  }

  static async updateEmail(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { id } = req.params;
    const updates = req.body;

    delete updates.id;
    delete updates.user_id;

    const updated = await DbService.update('emails', { id, user_id: userId }, updates);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Email not found.' });
    }

    return res.json({ success: true, email: updated });
  }

  static async deleteEmail(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { id } = req.params;

    const deleted = await DbService.delete('emails', { id, user_id: userId });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Email not found.' });
    }

    return res.json({ success: true, message: 'Email deleted.' });
  }

  static async sendEmail(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const { includeSignature = true, manualConfirmation = false, subject: overrideSubject, body: overrideBody, recipientEmail: overrideRecipient } = req.body;

      if (!manualConfirmation) {
        return res.status(400).json({
          success: false,
          message: 'MailMint is strictly anti-spam. You must review and manually confirm before sending.',
        });
      }

      const email = await DbService.findById('emails', id, userId);
      if (!email) {
        return res.status(404).json({ success: false, message: 'Email not found.' });
      }

      const user = await DbService.findById('users', userId);
      const isResendConfigured = !!user?.resend_api_key || !!ENV.RESEND_API_KEY;
      const isGmailConfigured = !!user?.gmail_connected;

      if (!isResendConfigured && !isGmailConfigured) {
        return res.status(400).json({
          success: false,
          message: 'No email service connected. Please connect Resend (Recommended for Cloud) or Gmail in Settings.',
        });
      }

      const contact = email.contact_id ? await DbService.findById('contacts', email.contact_id, userId) : null;
      const toEmail = (overrideRecipient || contact?.email || '').trim();

      if (!toEmail) {
        return res.status(400).json({
          success: false,
          message: 'Recipient email address is missing. Please provide a recipient email address.',
        });
      }

      // Update email record if overrides were provided
      if (overrideSubject || overrideBody) {
        await DbService.update('emails', { id, user_id: userId }, {
          subject: overrideSubject || email.subject,
          body: overrideBody || email.body,
        });
      }

      const activeSubject = overrideSubject || email.subject || 'Outreach';
      let finalBody = overrideBody || email.body || '';

      // Append signature if enabled
      if (includeSignature) {
        const profile = await DbService.findOne('profiles', { user_id: userId });
        const sig = profile?.email_signature;
        if (sig && (sig.name || sig.title)) {
          const sigText = `\n\n--\n${sig.name || ''}${sig.title ? ` | ${sig.title}` : ''}${sig.email ? `\n${sig.email}` : ''}${sig.linkedin ? `\n${sig.linkedin}` : ''}`;
          finalBody += sigText;
        }
      }

      const sendResult = await GmailService.sendEmail(userId, toEmail, activeSubject, finalBody);

      const updated = await DbService.update('emails', { id, user_id: userId }, {
        status: 'sent',
        sent_at: new Date().toISOString(),
        gmail_message_id: sendResult.messageId,
        thread_id: sendResult.threadId,
      });

      if (contact) {
        const contactUpdates: any = {
          status: 'sent',
          last_contacted: new Date().toISOString(),
        };
        if (!contact.email && toEmail) {
          contactUpdates.email = toEmail;
        }
        await DbService.update('contacts', { id: contact.id, user_id: userId }, contactUpdates);

        await DbService.insert('contact_timeline', {
          user_id: userId,
          contact_id: contact.id,
          action: 'sent',
          description: `Sent email: "${activeSubject}" to ${toEmail}`,
        });
      }

      await DbService.insert('notifications', {
        user_id: userId,
        type: 'email_sent',
        title: 'Email Sent Successfully',
        body: `Your outreach to ${contact?.name || toEmail} was sent from your inbox.`,
      });

      return res.json({ success: true, email: updated, sendResult });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static async scheduleEmail(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const { scheduledAt, timezone } = req.body;

      if (!scheduledAt) {
        return res.status(400).json({ success: false, message: 'Scheduled datetime is required.' });
      }

      const utcTime = new Date(scheduledAt).toISOString();

      const updated = await DbService.update('emails', { id, user_id: userId }, {
        status: 'scheduled',
        scheduled_at: utcTime,
      });

      const email = await DbService.findById('emails', id, userId);
      if (email?.contact_id) {
        await DbService.update('contacts', { id: email.contact_id, user_id: userId }, {
          status: 'scheduled',
          next_follow_up: utcTime,
        });

        await DbService.insert('contact_timeline', {
          user_id: userId,
          contact_id: email.contact_id,
          action: 'drafted',
          description: `Email scheduled for ${new Date(scheduledAt).toLocaleString()}`,
        });
      }

      return res.json({ success: true, email: updated });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static async approveFollowup(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { id } = req.params;

    const followup = await DbService.findById('follow_ups', id, userId);
    if (!followup) {
      return res.status(404).json({ success: false, message: 'Follow-up not found.' });
    }

    const updated = await DbService.update('follow_ups', { id, user_id: userId }, {
      status: 'approved',
      approved_by_user: true,
    });

    return res.json({ success: true, followup: updated });
  }

  static async sendTest(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const user = await DbService.findById('users', userId);

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      const targetEmail = user.gmail_email || user.email;
      const subject = 'MailMint · Test Email';
      const body = `Hi ${user.name || 'there'},\n\nThis is a test email sent via MailMint to verify your Gmail inbox integration.\n\nFresh outreach. Real connections.`;

      const result = await GmailService.sendEmail(userId, targetEmail, subject, body);

      return res.json({
        success: true,
        message: `Test email sent successfully to ${targetEmail}.`,
        result,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static async syncReplySentiment(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const { replyText, contactId: directContactId } = req.body;

      if (!replyText) {
        return res.status(400).json({ success: false, message: 'replyText is required for sentiment sync.' });
      }

      const email = id && id !== 'sync' ? await DbService.findById('emails', id, userId) : null;
      const contactId = directContactId || email?.contact_id;

      const analysis = await AiService.classifyReplySentiment(replyText);

      let targetStatus = 'replied';
      if (analysis.sentiment === 'polite_rejection') {
        targetStatus = 'closed';
      }

      let updatedContact = null;
      if (contactId) {
        updatedContact = await DbService.update('contacts', { id: contactId, user_id: userId }, {
          status: targetStatus,
          sentiment: analysis.sentiment,
          sentiment_label: analysis.sentimentLabel,
          last_reply_at: new Date().toISOString(),
        });

        await DbService.insert('contact_timeline', {
          user_id: userId,
          contact_id: contactId,
          action: 'replied',
          description: `Recruiter replied [${analysis.sentimentLabel}]: "${analysis.summary}"`,
        });

        await DbService.insert('notifications', {
          user_id: userId,
          type: 'reply_received',
          title: `Reply: ${analysis.sentimentLabel}`,
          message: `${analysis.summary} Recommended: ${analysis.recommendedNextAction}`,
          read: false,
        });
      }

      if (email) {
        await DbService.update('emails', { id, user_id: userId }, {
          replied_at: new Date().toISOString(),
          reply_sentiment: analysis.sentiment,
        });
      }

      return res.json({
        success: true,
        analysis,
        contact: updatedContact,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}
