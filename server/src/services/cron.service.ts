import cron from 'node-cron';
import { ENV } from '../config/env';
import { DbService } from './supabase.service';
import { GmailService } from './gmail.service';

export class CronService {
  static init() {
    console.log('✓ Initializing background automation & cron jobs...');

    // 1. Daily digest at 8:00 AM (or configured schedule)
    cron.schedule(ENV.DAILY_DIGEST_CRON, async () => {
      console.log('[Cron] Running daily outreach digest...');
      await this.runDailyDigest();
    });

    // 2. Snooze resurfacing & scheduled emails worker - runs every minute
    cron.schedule('* * * * *', async () => {
      await this.resurfaceExpiredSnoozes();
      await this.processScheduledEmails();
    });
  }

  /**
   * Resurface contacts whose snooze has expired
   */
  static async resurfaceExpiredSnoozes() {
    const now = new Date().toISOString();
    const contacts = await DbService.findMany('contacts', { is_snoozed: true });
    const expired = contacts.filter((c) => c.snoozed_until && c.snoozed_until <= now);

    for (const contact of expired) {
      await DbService.update('contacts', { id: contact.id }, {
        is_snoozed: false,
        status: contact.last_contacted ? 'sent' : 'new',
        snoozed_until: null,
      });

      await DbService.insert('contact_timeline', {
        user_id: contact.user_id,
        contact_id: contact.id,
        action: 'status-changed',
        description: `Contact automatically resurfaced from snooze.`,
      });

      await DbService.insert('notifications', {
        user_id: contact.user_id,
        type: 'snooze_expired',
        title: 'Contact resurfaced',
        body: `${contact.name} at ${contact.company || 'their company'} has resurfaced from snooze and is ready for outreach.`,
      });
    }
  }

  /**
   * Send emails that reached their scheduled_at time
   */
  static async processScheduledEmails() {
    const now = new Date().toISOString();
    const scheduledEmails = await DbService.findMany('emails', { status: 'scheduled' });
    const readyToSend = scheduledEmails.filter((e) => e.scheduled_at && e.scheduled_at <= now);

    for (const email of readyToSend) {
      try {
        const contact = email.contact_id ? await DbService.findById('contacts', email.contact_id) : null;
        const recipientEmail = contact?.email || 'recruiter@example.com';

        const result = await GmailService.sendEmail(
          email.user_id,
          recipientEmail,
          email.subject || 'Outreach',
          email.body || ''
        );

        await DbService.update('emails', { id: email.id }, {
          status: 'sent',
          sent_at: new Date().toISOString(),
          gmail_message_id: result.messageId,
          thread_id: result.threadId,
        });

        if (contact) {
          await DbService.update('contacts', { id: contact.id }, {
            status: 'sent',
            last_contacted: new Date().toISOString(),
          });

          await DbService.insert('contact_timeline', {
            user_id: email.user_id,
            contact_id: contact.id,
            action: 'sent',
            description: `Scheduled email sent: "${email.subject}"`,
          });
        }

        await DbService.insert('notifications', {
          user_id: email.user_id,
          type: 'email_sent',
          title: 'Scheduled email sent',
          body: `Your scheduled email to ${contact?.name || recipientEmail} was sent successfully.`,
        });
      } catch (err: any) {
        console.error(`Failed to send scheduled email ${email.id}:`, err);
      }
    }
  }

  /**
   * Run Daily Outreach Digest
   */
  static async runDailyDigest() {
    const users = await DbService.findMany('users', {});
    for (const user of users) {
      const followUpsDue = await DbService.findMany('follow_ups', {
        user_id: user.id,
        status: 'pending-approval',
      });
      const scheduledEmails = await DbService.findMany('emails', {
        user_id: user.id,
        status: 'scheduled',
      });
      const contacts = await DbService.findMany('contacts', {
        user_id: user.id,
      });
      const replied = contacts.filter((c) => c.status === 'replied').length;
      const sent = contacts.filter((c) => c.status === 'sent' || c.status === 'replied').length;
      const replyRate = sent > 0 ? Math.round((replied / sent) * 100) : 0;

      const body = `Today's outreach briefing: ${followUpsDue.length} follow-up(s) awaiting your review, ${scheduledEmails.length} email(s) scheduled to send. Current reply rate: ${replyRate}%.`;

      await DbService.insert('notifications', {
        user_id: user.id,
        type: 'daily_digest',
        title: 'Daily Outreach Digest',
        body,
      });
    }
  }
}
