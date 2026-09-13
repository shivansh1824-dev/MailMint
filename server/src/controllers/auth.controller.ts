import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
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
      const cookieOptions: any = {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
      };

      res.cookie('mailmint_access_token', accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
      });

      res.cookie('mailmint_refresh_token', refreshToken, {
        ...cookieOptions,
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
      const cookieOptions: any = {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
      };

      res.cookie('mailmint_access_token', accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
      });

      res.cookie('mailmint_refresh_token', refreshToken, {
        ...cookieOptions,
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
    const isProd = ENV.NODE_ENV === 'production';
    const cookieOptions: any = {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
    };
    res.clearCookie('mailmint_access_token', cookieOptions);
    res.clearCookie('mailmint_refresh_token', cookieOptions);
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
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000,
    });

    return res.json({
      success: true,
      accessToken: newAccessToken,
    });
  }

  static async forgotPassword(req: Request, res: Response) {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const user = await DbService.findOne('users', { email: email.toLowerCase().trim() });
    if (user) {
      // Generate a cryptographically secure 32-byte hex token with 1-hour expiry
      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      await DbService.update('users', { id: user.id }, {
        reset_token: hashedToken,
        reset_token_expires_at: expiresAt,
      });

      console.log(`[Security] Password reset requested for ${email}. Token generated.`);
    }

    // Always return success message to prevent user enumeration
    return res.json({
      success: true,
      message: 'If an account exists with that email, password reset instructions have been sent.',
    });
  }

  static async resetPassword(req: Request, res: Response) {
    const { token, password, email } = req.body;
    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Reset token and new password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const hashedToken = crypto.createHash('sha256').update(token.trim()).digest('hex');
    const now = new Date().toISOString();

    // Query user by reset token or match email if provided
    let user = await DbService.findOne('users', { reset_token: hashedToken });
    if (!user && email) {
      const candidate = await DbService.findOne('users', { email: email.toLowerCase().trim() });
      if (candidate && candidate.reset_token === hashedToken) {
        user = candidate;
      }
    }

    if (!user || !user.reset_token_expires_at || user.reset_token_expires_at < now) {
      return res.status(400).json({
        success: false,
        message: 'Password reset link is invalid or has expired. Please request a new one.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await DbService.update('users', { id: user.id }, {
      password_hash: passwordHash,
      reset_token: null,
      reset_token_expires_at: null,
    });

    return res.json({
      success: true,
      message: 'Password has been securely reset. You can now log in with your new credentials.',
    });
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
