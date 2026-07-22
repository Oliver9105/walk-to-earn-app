import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { AppError } from '../middleware/errorHandler';

const router = Router();
const prisma = new PrismaClient();

const registerSchema = z.object({
  phoneNumber: z.string().regex(/^\+?254[0-9]{9}$|^0[0-9]{9}$/, 'Invalid Kenyan phone number'),
  fullName: z.string().min(2).max(100),
  email: z.string().email().optional(),
  password: z.string().min(6).max(100),
  dateOfBirth: z.string().datetime().optional(),
});

const loginSchema = z.object({
  phoneNumber: z.string(),
  password: z.string(),
});

const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  email: z.string().email().optional().nullable(),
  dateOfBirth: z.string().datetime().optional().nullable(),
  dailyGoal: z.number().min(1000).max(50000).optional(),
  avatarUrl: z.string().url().optional().nullable(),
});

// Register
router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { phoneNumber, fullName, email, password, dateOfBirth } = req.body;

    // Normalize phone number
    let normalizedPhone = phoneNumber.replace(/\s+/g, '');
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone = '+254' + normalizedPhone.slice(1);
    }

    const existingUser = await prisma.user.findUnique({
      where: { phoneNumber: normalizedPhone },
    });

    if (existingUser) {
      throw new AppError('Phone number already registered', 409);
    }

    const passwordHash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || '12'));

    const user = await prisma.user.create({
      data: {
        phoneNumber: normalizedPhone,
        fullName,
        email,
        passwordHash,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      },
    });

    // Create default achievements tracking
    const achievements = await prisma.achievement.findMany();
    await prisma.userAchievement.createMany({
      data: achievements.map(a => ({
        userId: user.id,
        achievementId: a.id,
        progress: 0,
        completed: false,
      })),
    });

    const token = jwt.sign(
      { userId: user.id, phoneNumber: user.phoneNumber },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        token,
        user: {
          id: user.id,
          phoneNumber: user.phoneNumber,
          fullName: user.fullName,
          email: user.email,
          walletBalance: user.walletBalance,
          level: user.level,
          xp: user.xp,
          rank: user.rank,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { phoneNumber, password } = req.body;

    let normalizedPhone = phoneNumber.replace(/\s+/g, '');
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone = '+254' + normalizedPhone.slice(1);
    }

    const user = await prisma.user.findUnique({
      where: { phoneNumber: normalizedPhone },
    });

    if (!user) {
      throw new AppError('Invalid phone number or password', 401);
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new AppError('Invalid phone number or password', 401);
    }

    // Update last active
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    const token = jwt.sign(
      { userId: user.id, phoneNumber: user.phoneNumber },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          phoneNumber: user.phoneNumber,
          fullName: user.fullName,
          email: user.email,
          walletBalance: user.walletBalance,
          totalSteps: user.totalSteps,
          currentStreak: user.currentStreak,
          longestStreak: user.longestStreak,
          dailyGoal: user.dailyGoal,
          level: user.level,
          xp: user.xp,
          rank: user.rank,
          kycVerified: user.kycVerified,
          twoFactorEnabled: user.twoFactorEnabled,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        phoneNumber: true,
        fullName: true,
        email: true,
        avatarUrl: true,
        dateOfBirth: true,
        walletBalance: true,
        totalEarned: true,
        totalDeposited: true,
        totalWithdrawn: true,
        totalSteps: true,
        currentStreak: true,
        longestStreak: true,
        dailyGoal: true,
        level: true,
        xp: true,
        rank: true,
        kycVerified: true,
        twoFactorEnabled: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

// Update profile
router.patch('/profile', authenticate, validate(updateProfileSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: {
        ...req.body,
        dateOfBirth: req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : undefined,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        avatarUrl: true,
        dateOfBirth: true,
        dailyGoal: true,
      },
    });

    res.json({ success: true, message: 'Profile updated', data: user });
  } catch (error) {
    next(error);
  }
});

// Change password
router.post('/change-password', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
    });

    const isValid = await bcrypt.compare(currentPassword, user!.passwordHash);
    if (!isValid) {
      throw new AppError('Current password is incorrect', 400);
    }

    const newHash = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS || '12'));
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { passwordHash: newHash },
    });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
});

export { router as authRouter };
