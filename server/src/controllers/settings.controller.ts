import { Request, Response } from 'express';
import { DbService } from '../services/supabase.service';
import { ENV } from '../config/env';

export class SettingsController {
  static async getSettings(req: Request, res: Response) {
    const userId = req.user!.userId;
    const user = await DbService.findById('users', userId);

    return res.json({
      success: true,
      settings: {
        email: user?.email,
        name: user?.name,
        plan: user?.plan || 'free',
        timezone: ENV.DEFAULT_TIMEZONE,
        notifications: {
          dailyDigest: true,
          replies: true,
          followupReminders: true,
          snoozeAlerts: true,
        },
        outreachLimits: {
          maxDailyEmails: user?.plan === 'pro' ? 50 : ENV.MAX_EMAILS_PER_DAY_FREE,
          maxContacts: user?.plan === 'pro' ? 1000 : ENV.MAX_CONTACTS_FREE_PLAN,
          followupIntervalDays: 3,
        },
      },
    });
  }

  static async updateSettings(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { name } = req.body;

    const updated = await DbService.update('users', { id: userId }, { name });
    return res.json({ success: true, user: updated });
  }

  static async updateNotifications(req: Request, res: Response) {
    const { preferences } = req.body;
    return res.json({ success: true, preferences, message: 'Notification preferences updated.' });
  }

  static async updateOutreachLimits(req: Request, res: Response) {
    const { limits } = req.body;
    return res.json({ success: true, limits, message: 'Outreach limits updated.' });
  }
}
