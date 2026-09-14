import { ENV } from '../config/env';
import { decryptAES256, encryptAES256 } from '../utils/crypto';
import { DbService } from './supabase.service';

export interface SendResendEmailOptions {
  userId: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  from?: string;
  apiKey?: string;
}

export class ResendService {
  /**
   * Verify whether a Resend API Key is valid by calling Resend API
   */
  static async verifyApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    const cleanKey = apiKey.trim();
    if (!cleanKey || !cleanKey.startsWith('re_') || cleanKey.length < 15) {
      return { valid: false, error: 'Invalid Resend API Key format. Keys must begin with "re_"' };
    }

    try {
      const response = await fetch('https://api.resend.com/api-keys', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${cleanKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return { valid: true };
      }

      const errData: any = await response.json().catch(() => ({}));
      const msg = errData?.message || '';

      // Sending-access-only API keys in Resend return "This API key is restricted to only send emails" - which confirms it is valid!
      if (msg.includes('restricted to only send emails') || msg.includes('sending access')) {
        return { valid: true };
      }

      if (response.status === 401 || response.status === 403) {
        return {
          valid: false,
          error: msg || 'Invalid or unauthorized Resend API Key.',
        };
      }

      return { valid: true };
    } catch (err: any) {
      return { valid: true };
    }
  }

  /**
   * Connect and save Resend credentials for a user
   */
  static async connectResend(
    userId: string,
    apiKey: string,
    fromEmail?: string
  ): Promise<{ success: boolean; fromEmail: string }> {
    const cleanKey = apiKey.trim();
    const cleanFrom = fromEmail?.trim() || 'onboarding@resend.dev';

    const verifyResult = await this.verifyApiKey(cleanKey);
    if (!verifyResult.valid) {
      throw new Error(verifyResult.error || 'Invalid Resend API Key.');
    }

    const encryptedKey = encryptAES256(cleanKey);

    // Save to user record
    await DbService.update('users', { id: userId }, {
      resend_api_key: encryptedKey,
      resend_from_email: cleanFrom,
      email_provider: 'resend',
    });

    // Also update integrations table
    await DbService.delete('integrations', { user_id: userId, provider: 'resend' });
    await DbService.insert('integrations', {
      user_id: userId,
      provider: 'resend',
      email: cleanFrom,
      access_token: encryptedKey,
      scope: 'https://api.resend.com/emails',
    });

    return { success: true, fromEmail: cleanFrom };
  }

  /**
   * Disconnect Resend
   */
  static async disconnectResend(userId: string): Promise<boolean> {
    await DbService.update('users', { id: userId }, {
      resend_api_key: null,
      resend_from_email: null,
      email_provider: 'gmail',
    });
    await DbService.delete('integrations', { user_id: userId, provider: 'resend' });
    return true;
  }

  /**
   * Send an email via Resend HTTP REST API
   */
  static async sendEmail(
    options: SendResendEmailOptions
  ): Promise<{ messageId: string; threadId: string; provider: 'resend' }> {
    const { userId, to, subject, text, html } = options;

    const user = await DbService.findById('users', userId);
    
    // 1. Resolve API Key
    let apiKey = options.apiKey;
    if (!apiKey && user?.resend_api_key) {
      if (user.resend_api_key.startsWith('re_')) {
        apiKey = user.resend_api_key;
      } else {
        apiKey = decryptAES256(user.resend_api_key) || user.resend_api_key;
      }
    }
    if (!apiKey) {
      apiKey = ENV.RESEND_API_KEY;
    }

    if (!apiKey) {
      throw new Error('No Resend API Key configured. Please add your Resend API Key in Settings.');
    }

    // 2. Resolve From Email
    let senderEmail = options.from || user?.resend_from_email || ENV.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const senderName = user?.name || 'MailMint Outreach';
    
    let formattedFrom = senderEmail;
    if (!senderEmail.includes('<') && !senderEmail.includes('>')) {
      formattedFrom = `"${senderName}" <${senderEmail}>`;
    }

    // 3. Format Payload
    const payload: any = {
      from: formattedFrom,
      to: [to.trim()],
      subject: subject.trim(),
      text: text,
    };

    if (html) {
      payload.html = html;
    }

    // 4. Dispatch over HTTPS
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data: any = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('Resend API Error response:', data);
      const errMsg = data?.message || data?.error?.message || `Resend delivery failed with status ${response.status}`;
      throw new Error(`Resend Email delivery failed: ${errMsg}`);
    }

    const messageId = data?.id || `resend_${Date.now()}`;

    return {
      messageId,
      threadId: `resend_th_${Date.now()}`,
      provider: 'resend',
    };
  }
}
