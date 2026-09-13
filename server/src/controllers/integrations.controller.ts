import { Request, Response } from 'express';
import { GmailService } from '../services/gmail.service';
import { DbService } from '../services/supabase.service';
import { ENV } from '../config/env';

export class IntegrationsController {
  static async getGmailAuthUrl(req: Request, res: Response) {
    const userId = req.user!.userId;
    const state = Buffer.from(JSON.stringify({ userId, timestamp: Date.now() })).toString('base64');
    const url = GmailService.getAuthUrl(state);
    return res.json({ success: true, url });
  }

  static async connectWithAppPassword(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { email, appPassword } = req.body;

      if (!email || !appPassword) {
        return res.status(400).json({ success: false, message: 'Gmail address and App Password are required.' });
      }

      const result = await GmailService.connectAppPassword(userId, email, appPassword);
      return res.json({
        success: true,
        message: `Successfully connected ${result.email} via Google App Password!`,
        email: result.email,
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message || 'Failed to connect Gmail App Password.' });
    }
  }

  static async handleGmailCallback(req: Request, res: Response) {
    try {
      const { code, state } = req.query as { code?: string; state?: string };

      let userId = req.user?.userId;
      if (!userId && state) {
        try {
          const parsed = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
          userId = parsed.userId;
        } catch {
          // ignore
        }
      }

      if (!userId) {
        return res.redirect(`${ENV.FRONTEND_URL}/settings?error=unauthorized`);
      }

      const effectiveCode = code || 'mock_code';
      await GmailService.handleOAuthCallback(effectiveCode, userId);

      return res.redirect(`${ENV.FRONTEND_URL}/settings?gmail_connected=true`);
    } catch (err: any) {
      console.error('Gmail callback error:', err);
      return res.redirect(`${ENV.FRONTEND_URL}/settings?error=${encodeURIComponent(err.message)}`);
    }
  }

  static async getGmailStatus(req: Request, res: Response) {
    const userId = req.user!.userId;
    const status = await GmailService.getStatus(userId);
    return res.json({ success: true, ...status });
  }

  static async disconnectGmail(req: Request, res: Response) {
    const userId = req.user!.userId;
    await GmailService.disconnect(userId);
    return res.json({ success: true, message: 'Gmail account disconnected.' });
  }

  static async handleWebhook(req: Request, res: Response) {
    try {
      const { threadId, userId, contactEmail } = req.body;
      if (threadId && userId) {
        await GmailService.handleReplyReceived(userId, threadId, contactEmail);
      }
      return res.json({ success: true, message: 'Webhook processed.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static async sendTestEmail(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const user = await DbService.findById('users', userId);
      const recipient = user?.gmail_email || user?.email || 'user@example.com';

      const result = await GmailService.sendEmail(
        userId,
        recipient,
        'MailMint · Verified Inbox Connection',
        `Hello ${user?.name || ''}!\n\nYour Gmail integration is successfully connected and verified.\n\nAll outreach emails will be reviewed and sent directly through your authenticated inbox.\n\n— The MailMint Team`
      );

      return res.json({ success: true, message: `Test email sent to ${recipient}`, result });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}
