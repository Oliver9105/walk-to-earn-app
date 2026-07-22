import { Router } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { prisma } from '../server';

const router = Router();

// Get user profile with stats
router.get('/profile', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: {
        achievements: {
          include: { achievement: true },
          orderBy: { completedAt: 'desc' },
        },
        _count: {
          select: {
            enrollments: true,
            stepLogs: true,
            notifications: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Calculate rank
    const allUsers = await prisma.user.findMany({
      orderBy: { totalSteps: 'desc' },
      select: { id: true },
    });
    const globalRank = allUsers.findIndex(u => u.id === user.id) + 1;

    res.json({
      success: true,
      data: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        fullName: user.fullName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        dateOfBirth: user.dateOfBirth,
        walletBalance: user.walletBalance,
        totalEarned: user.totalEarned,
        totalDeposited: user.totalDeposited,
        totalWithdrawn: user.totalWithdrawn,
        totalSteps: user.totalSteps,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        dailyGoal: user.dailyGoal,
        level: user.level,
        xp: user.xp,
        rank: user.rank,
        globalRank,
        kycVerified: user.kycVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        achievements: user.achievements.map(ua => ({
          id: ua.achievement.id,
          name: ua.achievement.name,
          description: ua.achievement.description,
          icon: ua.achievement.icon,
          progress: ua.progress,
          requirementValue: ua.achievement.requirementValue,
          completed: ua.completed,
          completedAt: ua.completedAt,
          xpReward: ua.achievement.xpReward,
          coinReward: ua.achievement.coinReward,
          badgeColor: ua.achievement.badgeColor,
          rarity: ua.achievement.rarity,
        })),
        stats: {
          challengesJoined: user._count.enrollments,
          totalStepLogs: user._count.stepLogs,
          unreadNotifications: user._count.notifications,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res, next) => {
  try {
    const type = (req.query.type as string) || 'steps';
    const period = (req.query.period as string) || 'all';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    let orderBy: any = { totalSteps: 'desc' };
    if (type === 'earnings') orderBy = { totalEarned: 'desc' };
    if (type === 'streak') orderBy = { currentStreak: 'desc' };
    if (type === 'level') orderBy = { level: 'desc' };

    const users = await prisma.user.findMany({
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        totalSteps: true,
        totalEarned: true,
        currentStreak: true,
        level: true,
        xp: true,
        rank: true,
      },
    });

    res.json({
      success: true,
      data: users.map((u, i) => ({
        rank: (page - 1) * limit + i + 1,
        ...u,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// Search users
router.get('/search', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const query = req.query.q as string;
    if (!query || query.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { fullName: { contains: query, mode: 'insensitive' } },
          { phoneNumber: { contains: query } },
        ],
        NOT: { id: req.user!.userId },
      },
      take: 20,
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        rank: true,
        level: true,
      },
    });

    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
});

export { router as userRouter };
