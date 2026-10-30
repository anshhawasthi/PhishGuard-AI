import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { ActivityLog } from '../models/ActivityLog';
import { config } from '../config';
import { isDbConnected } from '../database/connection';
import { AuthenticatedRequest } from '../middleware/auth';

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { full_name, email, password } = req.body;
    if (!full_name || !email || !password) {
      res.status(400).json({ error: 'Full name, email, and password are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long' });
      return;
    }

    if (!isDbConnected()) {
      res.status(503).json({ error: 'Database service is currently unavailable. Please verify MongoDB connection.' });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // If this is the configured admin email, automatically grant admin role
    const role = email.toLowerCase() === config.adminEmail.toLowerCase() ? 'admin' : 'user';

    const newUser = new User({
      full_name,
      email: email.toLowerCase(),
      password_hash,
      role,
    });

    await newUser.save();

    await ActivityLog.create({
      user_id: newUser._id,
      action: 'USER_REGISTER',
      description: `User ${newUser.email} created account.`,
      ip_address: req.ip,
    }).catch(() => {});

    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, role: newUser.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: newUser._id,
        full_name: newUser.full_name,
        email: newUser.email,
        role: newUser.role,
        created_at: newUser.created_at,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error during registration' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    if (!isDbConnected()) {
      // In emergency / demo mode without active MongoDB, support admin credential bypass for viva demo
      if (email.toLowerCase() === config.adminEmail.toLowerCase() && password === config.adminPassword) {
        const token = jwt.sign(
          { id: 'admin_demo_id', email: config.adminEmail, role: 'admin' },
          config.jwtSecret,
          { expiresIn: config.jwtExpiresIn as any }
        );
        res.json({
          message: 'Admin demo login successful',
          token,
          user: {
            id: 'admin_demo_id',
            full_name: 'PhishGuard Administrator',
            email: config.adminEmail,
            role: 'admin',
            created_at: new Date(),
          },
        });
        return;
      }
      res.status(503).json({ error: 'Database service is currently unavailable. Please check MongoDB.' });
      return;
    }

    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Auto-provision admin if matching default admin credentials
      if (email.toLowerCase() === config.adminEmail.toLowerCase() && password === config.adminPassword) {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(config.adminPassword, salt);
        user = await User.create({
          full_name: 'System Administrator',
          email: config.adminEmail.toLowerCase(),
          password_hash,
          role: 'admin',
          is_active: true,
        });
      } else {
        res.status(401).json({ error: 'Invalid email or password. If you do not have an account, please click Register.' });
        return;
      }
    }

    if (!user.is_active) {
      res.status(403).json({ error: 'Account has been deactivated. Please contact administrator.' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    await ActivityLog.create({
      user_id: user._id,
      action: 'USER_LOGIN',
      description: `User ${user.email} authenticated.`,
      ip_address: req.ip,
    }).catch(() => {});

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error during login' });
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!isDbConnected()) {
      res.json({
        user: {
          id: req.user.id,
          full_name: req.user.role === 'admin' ? 'Administrator' : 'Demo User',
          email: req.user.email,
          role: req.user.role,
        },
      });
      return;
    }

    const user = await User.findById(req.user.id).select('-password_hash');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
