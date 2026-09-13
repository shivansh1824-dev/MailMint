import { Request, Response } from 'express';
import { DbService } from '../services/supabase.service';

export class CampaignsController {
  static async getCampaigns(req: Request, res: Response) {
    const userId = req.user!.userId;
    const campaigns = await DbService.findMany('campaigns', { user_id: userId }, { orderBy: 'created_at', ascending: false });
    return res.json({ success: true, campaigns });
  }

  static async createCampaign(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { name, description, company_id, contact_ids = [], template_id, ab_test } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Campaign name is required.' });
    }

    const campaign = await DbService.insert('campaigns', {
      user_id: userId,
      name,
      description: description || '',
      company_id: company_id || null,
      contact_ids,
      template_id: template_id || null,
      status: 'active',
      ab_test: ab_test || null,
      stats: {
        sent: 0,
        replies: 0,
        variantA: { sent: 0, replies: 0 },
        variantB: { sent: 0, replies: 0 },
      },
    });

    // If A/B test is configured, distribute contacts 50/50 alternating
    if (ab_test && ab_test.enabled && Array.isArray(contact_ids) && contact_ids.length > 0) {
      for (let i = 0; i < contact_ids.length; i++) {
        const contactId = contact_ids[i];
        const variant = i % 2 === 0 ? 'A' : 'B';
        const template = variant === 'A' ? ab_test.templateA : ab_test.templateB;

        await DbService.insert('emails', {
          user_id: userId,
          contact_id: contactId,
          campaign_id: campaign.id,
          type: 'cold-email',
          subject: template?.subject || `Campaign Outreach (${variant})`,
          body: template?.body || 'Hello,\n\nReaching out regarding your team.',
          status: 'draft',
          ab_variant: variant,
        });
      }
    }

    return res.status(201).json({ success: true, campaign });
  }

  static async getCampaignById(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { id } = req.params;

    const campaign = await DbService.findById('campaigns', id, userId);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' });
    }

    const emails = await DbService.findMany('emails', { campaign_id: id, user_id: userId });

    return res.json({ success: true, campaign, emails });
  }

  static async updateCampaign(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { id } = req.params;
    const updates = req.body;

    delete updates.id;
    delete updates.user_id;

    const updated = await DbService.update('campaigns', { id, user_id: userId }, updates);
    return res.json({ success: true, campaign: updated });
  }

  static async deleteCampaign(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { id } = req.params;

    const deleted = await DbService.delete('campaigns', { id, user_id: userId });
    return res.json({ success: true, message: 'Campaign deleted.' });
  }

  static async pauseCampaign(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { id } = req.params;

    const updated = await DbService.update('campaigns', { id, user_id: userId }, { status: 'paused' });
    return res.json({ success: true, campaign: updated });
  }

  static async resumeCampaign(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { id } = req.params;

    const updated = await DbService.update('campaigns', { id, user_id: userId }, { status: 'active' });
    return res.json({ success: true, campaign: updated });
  }

  static async getStats(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { id } = req.params;

    const campaign = await DbService.findById('campaigns', id, userId);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' });
    }

    const emails = await DbService.findMany('emails', { campaign_id: id, user_id: userId });
    const sent = emails.filter((e) => e.status === 'sent' || e.status === 'replied').length;
    const replied = emails.filter((e) => e.status === 'replied').length;

    const variantAEmails = emails.filter((e) => e.ab_variant === 'A');
    const variantASent = variantAEmails.filter((e) => e.status === 'sent' || e.status === 'replied').length;
    const variantAReplied = variantAEmails.filter((e) => e.status === 'replied').length;
    const variantARate = variantASent > 0 ? Math.round((variantAReplied / variantASent) * 100) : 0;

    const variantBEmails = emails.filter((e) => e.ab_variant === 'B');
    const variantBSent = variantBEmails.filter((e) => e.status === 'sent' || e.status === 'replied').length;
    const variantBReplied = variantBEmails.filter((e) => e.status === 'replied').length;
    const variantBRate = variantBSent > 0 ? Math.round((variantBReplied / variantBSent) * 100) : 0;

    let winner = null;
    if (Math.abs(variantARate - variantBRate) >= 5 && (variantASent + variantBSent) >= 4) {
      winner = variantARate > variantBRate ? 'A' : 'B';
    }

    return res.json({
      success: true,
      stats: {
        totalContacts: campaign.contact_ids?.length || 0,
        sent,
        replied,
        replyRate: sent > 0 ? Math.round((replied / sent) * 100) : 0,
        variantA: { sent: variantASent, replied: variantAReplied, rate: variantARate },
        variantB: { sent: variantBSent, replied: variantBReplied, rate: variantBRate },
        winner,
        notice: 'Results are indicative. Statistical significance requires larger sample sizes.',
      },
    });
  }
}
