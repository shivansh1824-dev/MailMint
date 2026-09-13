import { Request, Response } from 'express';
import { DbService } from '../services/supabase.service';

export class NotificationsController {
  static async getNotifications(req: Request, res: Response) {
    const userId = req.user!.userId;
    const notifications = await DbService.findMany(
      'notifications',
      { user_id: userId },
      { orderBy: 'created_at', ascending: false }
    );
    const unreadCount = notifications.filter((n) => !n.read).length;
    return res.json({ success: true, notifications, unreadCount });
  }

  static async markAsRead(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { id } = req.params;

    const updated = await DbService.update('notifications', { id, user_id: userId }, { read: true });
    return res.json({ success: true, notification: updated });
  }

  static async markAllAsRead(req: Request, res: Response) {
    const userId = req.user!.userId;
    const notifications = await DbService.findMany('notifications', { user_id: userId, read: false });

    for (const n of notifications) {
      await DbService.update('notifications', { id: n.id, user_id: userId }, { read: true });
    }

    return res.json({ success: true, message: 'All notifications marked as read.' });
  }
}
