import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { DbService } from '../services/supabase.service';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { ENV } from '../config/env';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { email, password, name } = registerSchema.parse(req.body);

      const existing = await DbService.findOne('users', { email });
      if (existing) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      }

      // bcrypt salt rounds 12
      const passwordHash = await bcrypt.hash(password, 12);

      const user = await DbService.insert('users', {
        email,
        password_hash: passwordHash,
        name: name || email.split('@')[0],
        plan: 'free',
      });

      // Automatically create empty profile
      await DbService.insert('profiles', {
        user_id: user.id,
        full_name: name || email.split('@')[0],
        headline: 'Job Seeker & Developer',
        email,
        skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
        experience: [],
        projects: [],
        achievements: [],
        certifications: [],
        technologies: ['React', 'TypeScript', 'Node.js'],
        email_signature: {
          name: name || email.split('@')[0],
          title: 'Software Engineer',
          email,
          phone: '',
          linkedin: '',
          github: '',
          portfolio: '',
          layout: 'standard',
        },
      });

      // Welcome notification
      await DbService.insert('notifications', {
        user_id: user.id,
        type: 'welcome',
        title: 'Welcome to MailMint!',
        body: 'Fresh outreach, real connections. Complete your profile and add your first contact to get started.',
      });

      const tokenPayload = { userId: user.id, email: user.email, plan: user.plan };
      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      // Set httpOnly cookies
      const isProd = ENV.NODE_ENV === 'production';
      res.cookie('mailmint_access_token', accessToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
      });

      res.cookie('mailmint_refresh_token', refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(201).json({
        success: true,
        user: { id: user.id, email: user.email, name: user.name, plan: user.plan },
        accessToken,
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = loginSchema.parse(req.body);

      const user = await DbService.findOne('users', { email });
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      const tokenPayload = { userId: user.id, email: user.email, plan: user.plan };
      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      const isProd = ENV.NODE_ENV === 'production';
      res.cookie('mailmint_access_token', accessToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
      });

      res.cookie('mailmint_refresh_token', refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          plan: user.plan,
          gmailConnected: user.gmail_connected,
          gmailEmail: user.gmail_email,
        },
        accessToken,
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  static async logout(req: Request, res: Response) {
    res.clearCookie('mailmint_access_token');
    res.clearCookie('mailmint_refresh_token');
    return res.json({ success: true, message: 'Logged out successfully.' });
  }

  static async refreshToken(req: Request, res: Response) {
    const refreshToken = req.cookies?.['mailmint_refresh_token'] || req.body?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'No refresh token provided.' });
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
    }

    const user = await DbService.findById('users', payload.userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    const tokenPayload = { userId: user.id, email: user.email, plan: user.plan };
    const newAccessToken = generateAccessToken(tokenPayload);

    const isProd = ENV.NODE_ENV === 'production';
    res.cookie('mailmint_access_token', newAccessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    return res.json({
      success: true,
      accessToken: newAccessToken,
    });
  }

  static async forgotPassword(req: Request, res: Response) {
    const { email } = req.body;
    // Password reset simulation / response
    return res.json({
      success: true,
      message: 'If an account exists with that email, password reset instructions have been sent.',
    });
  }

  static async resetPassword(req: Request, res: Response) {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and new password required.' });
    }

    const user = await DbService.findOne('users', { email });
    if (user) {
      const passwordHash = await bcrypt.hash(password, 12);
      await DbService.update('users', { id: user.id }, { password_hash: passwordHash });
    }

    return res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  }

  static async me(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const user = await DbService.findById('users', userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        gmailConnected: Boolean(user.gmail_connected),
        gmailEmail: user.gmail_email,
        createdAt: user.created_at,
      },
    });
  }
}
