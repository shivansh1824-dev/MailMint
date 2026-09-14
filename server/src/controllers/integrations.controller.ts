import { Request, Response } from 'express';
import { GmailService } from '../services/gmail.service';
import { ResendService } from '../services/resend.service';
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

  static async connectResend(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { apiKey, fromEmail } = req.body;

      if (!apiKey) {
        return res.status(400).json({ success: false, message: 'Resend API Key is required.' });
      }

      const result = await ResendService.connectResend(userId, apiKey, fromEmail);
      return res.json({
        success: true,
        message: `Successfully connected Resend! Emails will send from ${result.fromEmail}.`,
        fromEmail: result.fromEmail,
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message || 'Failed to connect Resend.' });
    }
  }

  static async disconnectResend(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      await ResendService.disconnectResend(userId);
      return res.json({ success: true, message: 'Resend integration disconnected.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getGmailStatus(req: Request, res: Response) {
    const userId = req.user!.userId;
    const gmailStatus = await GmailService.getStatus(userId);
    const user = await DbService.findById('users', userId);

    const hasResend = !!user?.resend_api_key || !!ENV.RESEND_API_KEY;
    const activeProvider = user?.email_provider || (hasResend ? 'resend' : gmailStatus.connected ? 'gmail' : 'none');

    return res.json({
      success: true,
      ...gmailStatus,
      resendConnected: hasResend,
      resendFromEmail: user?.resend_from_email || ENV.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      activeProvider,
    });
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
      const recipient = user?.email || user?.gmail_email || 'user@example.com';

      let result: any;
      const shouldUseResend = user?.email_provider === 'resend' || user?.resend_api_key || (!user?.gmail_connected && ENV.RESEND_API_KEY);

      if (shouldUseResend) {
        result = await ResendService.sendEmail({
          userId,
          to: recipient,
          subject: 'MailMint · Verified Resend Email Connection',
          text: `Hello ${user?.name || ''}!\n\nYour Resend integration is successfully connected and verified.\n\nOutreach emails will now send over HTTPS via Resend.\n\n— The MailMint Team`,
        });
      } else {
        result = await GmailService.sendEmail(
          userId,
          recipient,
          'MailMint · Verified Inbox Connection',
          `Hello ${user?.name || ''}!\n\nYour Gmail integration is successfully connected and verified.\n\nAll outreach emails will be reviewed and sent directly through your authenticated inbox.\n\n— The MailMint Team`
        );
      }

      return res.json({ success: true, message: `Test email sent to ${recipient}`, result });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}
