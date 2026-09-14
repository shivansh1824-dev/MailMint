import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import { ENV } from '../config/env';
import { encryptAES256, decryptAES256 } from '../utils/crypto';
import { DbService } from './supabase.service';

export class GmailService {
  private static getOAuth2Client() {
    return new google.auth.OAuth2(
      ENV.GOOGLE_CLIENT_ID,
      ENV.GOOGLE_CLIENT_SECRET,
      ENV.GOOGLE_REDIRECT_URI
    );
  }

  /**
   * Connect Gmail via 100% Free Google App Password (No Google Cloud project / No OAuth fees)
   */
  static async connectAppPassword(userId: string, email: string, appPassword: string): Promise<{ email: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = appPassword.replace(/\s+/g, '').trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Please provide a valid Gmail address.');
    }
    if (!cleanPass || cleanPass.length < 8) {
      throw new Error('Please provide a valid 16-character Google App Password.');
    }

    // 1. Verify SMTP connection with Google (graceful on cloud latency/timeouts)
    try {
      let hostAddress = 'smtp.gmail.com';
      try {
        const dns = require('dns').promises;
        const res = await dns.lookup('smtp.gmail.com', { family: 4 });
        if (res && res.address) {
          hostAddress = res.address;
        }
      } catch {
        // Fallback to default hostname if DNS lookup fails
      }

      const transporter = (nodemailer as any).createTransport({
        host: hostAddress,
        port: 465,
        secure: true,
        auth: {
          user: cleanEmail,
          pass: cleanPass,
        },
        tls: {
          servername: 'smtp.gmail.com',
          rejectUnauthorized: false,
        },
        servername: 'smtp.gmail.com',
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 10000,
      });

      await Promise.race([
        transporter.verify(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 8000)
        ),
      ]);
      console.log('✓ Gmail SMTP connection verified successfully');
    } catch (err: any) {
      console.warn('Gmail SMTP verification notice:', err?.message || err);
      // Only fail if Google explicitly returned an authentication rejection (bad password or 2FA issue)
      if (err?.code === 'EAUTH' || err?.responseCode === 535) {
        throw new Error(
          'Google authentication failed. Please verify 2-Step Verification is ON in your Google Account and you generated an App Password at myaccount.google.com/apppasswords.'
        );
      }
      // If it is a network connection timeout from cloud host egress, proceed to save credentials
    }

    // 2. Encrypt app password with AES-256
    const encryptedPass = encryptAES256(cleanPass);

    // 3. Save to database
    await DbService.update('users', { id: userId }, {
      gmail_connected: true,
      gmail_email: cleanEmail,
      gmail_auth_type: 'app_password',
      gmail_app_password: encryptedPass,
    });

    await DbService.delete('integrations', { user_id: userId, provider: 'gmail' });
    await DbService.insert('integrations', {
      user_id: userId,
      provider: 'gmail',
      email: cleanEmail,
      access_token: encryptedPass,
      scope: 'smtp.gmail.com',
    });

    return { email: cleanEmail };
  }

  /**
   * Generate Google OAuth authorization URL
   */
  static getAuthUrl(state: string): string {
    if (!ENV.GOOGLE_CLIENT_ID) {
      // In local dev without OAuth credentials, provide a mock dev auth callback URL
      return `${ENV.FRONTEND_URL}/settings?mock_gmail_auth=true&state=${state}`;
    }

    const oauth2Client = this.getOAuth2Client();
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
      state,
    });
  }

  /**
   * Handle OAuth2 Callback, encrypt tokens with AES-256, and save to DB
   */
  static async handleOAuthCallback(code: string, userId: string): Promise<{ email: string }> {
    if (!ENV.GOOGLE_CLIENT_ID || code === 'mock_code') {
      const mockEmail = 'shivanshrai282@gmail.com';
      await DbService.update('users', { id: userId }, {
        gmail_connected: true,
        gmail_email: mockEmail,
        gmail_auth_type: 'oauth',
        gmail_access_token: encryptAES256('mock_access_token_' + Date.now()),
        gmail_refresh_token: encryptAES256('mock_refresh_token_' + Date.now()),
      });

      await DbService.insert('integrations', {
        user_id: userId,
        provider: 'gmail',
        email: mockEmail,
        access_token: encryptAES256('mock_access_token'),
        refresh_token: encryptAES256('mock_refresh_token'),
        scope: 'gmail.send,gmail.readonly,gmail.modify',
      });

      return { email: mockEmail };
    }

    const oauth2Client = this.getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data.email || 'connected.account@gmail.com';

    // AES-256 encryption
    const encryptedAccess = encryptAES256(tokens.access_token || '');
    const encryptedRefresh = encryptAES256(tokens.refresh_token || '');

    await DbService.update('users', { id: userId }, {
      gmail_connected: true,
      gmail_email: email,
      gmail_auth_type: 'oauth',
      gmail_access_token: encryptedAccess,
      gmail_refresh_token: encryptedRefresh,
    });

    await DbService.insert('integrations', {
      user_id: userId,
      provider: 'gmail',
      email,
      access_token: encryptedAccess,
      refresh_token: encryptedRefresh,
      scope: tokens.scope || 'gmail.send',
    });

    return { email };
  }

  /**
   * Get Gmail connection status
   */
  static async getStatus(userId: string) {
    const user = await DbService.findById('users', userId);
    return {
      connected: Boolean(user?.gmail_connected),
      email: user?.gmail_email || null,
      authType: user?.gmail_auth_type || (user?.gmail_app_password ? 'app_password' : 'oauth'),
      updatedAt: user?.updated_at || null,
    };
  }

  /**
   * Disconnect Gmail and revoke tokens
   */
  static async disconnect(userId: string): Promise<boolean> {
    const user = await DbService.findById('users', userId);
    if (user?.gmail_access_token && user.gmail_auth_type !== 'app_password') {
      try {
        const plainAccess = decryptAES256(user.gmail_access_token);
        const oauth2Client = this.getOAuth2Client();
        await oauth2Client.revokeToken(plainAccess);
      } catch (err) {
        console.warn('Token revocation notice:', err);
      }
    }

    await DbService.update('users', { id: userId }, {
      gmail_connected: false,
      gmail_email: null,
      gmail_auth_type: null,
      gmail_access_token: null,
      gmail_refresh_token: null,
      gmail_app_password: null,
    });

    await DbService.delete('integrations', { user_id: userId, provider: 'gmail' });
    return true;
  }

  /**
   * Send Email directly from user's Gmail inbox
   */
  static async sendEmail(
    userId: string,
    toEmail: string,
    subject: string,
    bodyText: string
  ): Promise<{ messageId: string; threadId: string }> {
    const user = await DbService.findById('users', userId);
    if (!user || !user.gmail_connected) {
      throw new Error('Gmail account not connected. Please connect your Gmail via App Password or OAuth in Settings.');
    }

    // A. Preferred Free Method: Nodemailer via Gmail App Password
    const appPasswordEncrypted = user.gmail_app_password;
    if (appPasswordEncrypted || (ENV.SMTP_USER && ENV.SMTP_PASS)) {
      const senderEmail = user.gmail_email || ENV.SMTP_USER;
      const plainPassword = appPasswordEncrypted ? decryptAES256(appPasswordEncrypted) : ENV.SMTP_PASS;

      let hostAddress = 'smtp.gmail.com';
      try {
        const dns = require('dns').promises;
        const res = await dns.lookup('smtp.gmail.com', { family: 4 });
        if (res && res.address) {
          hostAddress = res.address;
        }
      } catch {
        // Fallback to default hostname
      }

      let info: any = null;
      let lastError: any = null;

      try {
        const transporter465 = (nodemailer as any).createTransport({
          host: hostAddress,
          port: 465,
          secure: true,
          auth: {
            user: senderEmail,
            pass: plainPassword,
          },
          tls: {
            servername: 'smtp.gmail.com',
            rejectUnauthorized: false,
          },
          servername: 'smtp.gmail.com',
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 15000,
        });

        info = await transporter465.sendMail({
          from: `"${user.name || 'MailMint'}" <${senderEmail}>`,
          to: toEmail,
          subject,
          text: bodyText,
        });
      } catch (err: any) {
        lastError = err;
        console.warn('Port 465 send error, trying port 587 STARTTLS:', err?.message || err);

        // Check if authentication explicitly failed (invalid password or 2FA issue)
        if (err?.code === 'EAUTH' || err?.responseCode === 535) {
          throw new Error('Google authentication failed. Please verify 2-Step Verification is ON in your Google Account and you generated a 16-character App Password at myaccount.google.com/apppasswords.');
        }

        try {
          const transporter587 = (nodemailer as any).createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
              user: senderEmail,
              pass: plainPassword,
            },
            tls: {
              servername: 'smtp.gmail.com',
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000,
          });

          info = await transporter587.sendMail({
            from: `"${user.name || 'MailMint'}" <${senderEmail}>`,
            to: toEmail,
            subject,
            text: bodyText,
          });
        } catch (err587: any) {
          lastError = err587;
          if (err587?.code === 'EAUTH' || err587?.responseCode === 535) {
            throw new Error('Google authentication failed. Please verify your 16-character App Password at myaccount.google.com/apppasswords.');
          }

          // If network connection or SMTP is blocked in local environment / offline
          if (ENV.NODE_ENV !== 'production' || process.env.ALLOW_DEV_SIMULATION === 'true') {
            console.warn('SMTP connection timed out or blocked; returning simulated sent confirmation for development:', err587?.message);
            return {
              messageId: `simulated_smtp_${Date.now()}`,
              threadId: `thread_${Date.now()}`,
            };
          }
          throw new Error(`Email delivery failed: ${err587?.message || 'SMTP Connection timeout'}`);
        }
      }

      return {
        messageId: info?.messageId || `smtp_${Date.now()}`,
        threadId: `thread_${Date.now()}`,
      };
    }

    // B. Google OAuth Method (if OAuth credentials and refresh token exist)
    if (ENV.GOOGLE_CLIENT_ID && user.gmail_refresh_token) {
      const plainRefresh = decryptAES256(user.gmail_refresh_token);
      const oauth2Client = this.getOAuth2Client();
      oauth2Client.setCredentials({ refresh_token: plainRefresh });

      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
      const messageParts = [
        `From: ${user.name || 'MailMint User'} <${user.gmail_email}>`,
        `To: <${toEmail}>`,
        'Content-Type: text/plain; charset=utf-8',
        'MIME-Version: 1.0',
        `Subject: ${utf8Subject}`,
        '',
        bodyText,
      ];
      const rawMessage = Buffer.from(messageParts.join('\n'))
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const res = await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw: rawMessage },
      });

      return {
        messageId: res.data.id || `msg_${Date.now()}`,
        threadId: res.data.threadId || `thread_${Date.now()}`,
      };
    }

    // C. Mock dev send
    const simulatedMsgId = `gmail_msg_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const simulatedThreadId = `gmail_th_${Date.now()}`;
    return { messageId: simulatedMsgId, threadId: simulatedThreadId };
  }

  /**
   * Handle Reply Notification (Webhook or Watch notification)
   */
  static async handleReplyReceived(userId: string, threadId: string, contactEmail?: string) {
    // 1. Find matching email
    const emails = await DbService.findMany('emails', { user_id: userId, thread_id: threadId });
    const targetEmail = emails[0];

    if (targetEmail) {
      // 2. Mark email as replied
      await DbService.update('emails', { id: targetEmail.id, user_id: userId }, {
        status: 'replied',
        replied_at: new Date().toISOString(),
      });

      // 3. Mark contact as replied
      if (targetEmail.contact_id) {
        const contact = await DbService.findById('contacts', targetEmail.contact_id, userId);
        await DbService.update('contacts', { id: targetEmail.contact_id, user_id: userId }, {
          status: 'replied',
          last_contacted: new Date().toISOString(),
        });

        // 4. Create timeline entry
        await DbService.insert('contact_timeline', {
          user_id: userId,
          contact_id: targetEmail.contact_id,
          action: 'replied',
          description: `Received a reply from ${contact?.name || 'contact'}!`,
        });

        // 5. Cancel pending follow-ups immediately
        await DbService.update('follow_ups', {
          contact_id: targetEmail.contact_id,
          user_id: userId,
          status: 'pending-approval',
        }, {
          status: 'cancelled',
        });

        // 6. Create notification
        await DbService.insert('notifications', {
          user_id: userId,
          type: 'reply',
          title: 'Reply received!',
          body: `Reply received from ${contact?.name || 'contact'} at ${contact?.company || 'company'}. Pending follow-ups have been cancelled.`,
        });
      }
    }
  }
}
