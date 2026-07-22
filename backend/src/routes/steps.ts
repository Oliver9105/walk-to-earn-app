import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { AppError } from '../middleware/errorHandler';
import { prisma } from '../server';

const router = Router();

const logStepsSchema = z.object({
  steps: z.number().min(1).max(50000),
  distance: z.number().optional(),
  duration: z.number().optional(),
  calories: z.number().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  deviceId: z.string().optional(),
});

// Log general steps (not tied to a challenge)
router.post('/log', authenticate, validate(logStepsSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { steps, distance, duration, calories, latitude, longitude, deviceId } = req.body;
    const userId = req.user!.userId;

    // Check daily limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayLogs = await prisma.stepLog.aggregate({
      where: {
        userId,
        loggedAt: { gte: today, lt: tomorrow },
      },
      _sum: { steps: true },
    });

    const todayTotal = todayLogs._sum.steps || 0;
    const maxDaily = parseInt(process.env.MAX_DAILY_STEPS || '50000');

    if (todayTotal + steps > maxDaily) {
      throw new AppError('Daily step limit exceeded', 400);
    }

    // Create step log
    const stepLog = await prisma.stepLog.create({
      data: {
        userId,
        steps,
        distance,
        duration,
        calories,
        latitude,
        longitude,
        deviceId,
        confidence: 1.0,
      },
    });

    // Update user stats
    await prisma.user.update({
      where: { id: userId },
      data: {
        totalSteps: { increment: steps },
        lastActiveAt: new Date(),
      },
    });

    // Check and update streak
    await updateStreak(userId);

    // Check achievements
    await checkAchievements(userId);

    res.json({
      success: true,
      data: {
        stepLog,
        todayTotal: todayTotal + steps,
        dailyGoal: (await prisma.user.findUnique({ where: { id: userId } }))?.dailyGoal,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get step history
router.get('/history', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const days = parseInt(req.query.days as string) || 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await prisma.stepLog.findMany({
      where: {
        userId,
        loggedAt: { gte: startDate },
      },
      orderBy: { loggedAt: 'desc' },
    });

    // Aggregate by day
    const dailyStats: Record<string, { steps: number; distance: number; calories: number; duration: number }> = {};

    for (const log of logs) {
      const date = log.loggedAt.toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { steps: 0, distance: 0, calories: 0, duration: 0 };
      }
      dailyStats[date].steps += log.steps;
      if (log.distance) dailyStats[date].distance += log.distance;
      if (log.calories) dailyStats[date].calories += log.calories;
      if (log.duration) dailyStats[date].duration += log.duration;
    }

    res.json({
      success: true,
      data: {
        logs,
        dailyStats: Object.entries(dailyStats).map(([date, stats]) => ({
          date,
          ...stats,
        })).sort((a, b) => b.date.localeCompare(a.date)),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get today's stats
router.get('/today', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [user, todayLogs, weekLogs] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { totalSteps: true, currentStreak: true, dailyGoal: true, level: true, xp: true },
      }),
      prisma.stepLog.aggregate({
        where: { userId, loggedAt: { gte: today, lt: tomorrow } },
        _sum: { steps: true, distance: true, calories: true, duration: true },
      }),
      prisma.stepLog.findMany({
        where: {
          userId,
          loggedAt: {
            gte: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000),
            lt: tomorrow,
          },
        },
        orderBy: { loggedAt: 'desc' },
      }),
    ]);

    // Calculate weekly stats
    const weeklySteps: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      weeklySteps[d.toISOString().split('T')[0]] = 0;
    }

    for (const log of weekLogs) {
      const date = log.loggedAt.toISOString().split('T')[0];
      if (weeklySteps[date] !== undefined) {
        weeklySteps[date] += log.steps;
      }
    }

    res.json({
      success: true,
      data: {
        today: {
          steps: todayLogs._sum.steps || 0,
          distance: todayLogs._sum.distance || 0,
          calories: todayLogs._sum.calories || 0,
          duration: todayLogs._sum.duration || 0,
          goalProgress: user?.dailyGoal ? Math.min(100, ((todayLogs._sum.steps || 0) / user.dailyGoal) * 100) : 0,
        },
        totalSteps: user?.totalSteps,
        currentStreak: user?.currentStreak,
        dailyGoal: user?.dailyGoal,
        level: user?.level,
        xp: user?.xp,
        weeklySteps: Object.entries(weeklySteps).map(([date, steps]) => ({
          date,
          steps,
        })).sort((a, b) => a.date.localeCompare(b.date)),
      },
    });
  } catch (error) {
    next(error);
  }
});

async function updateStreak(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Check if user logged steps yesterday
  const yesterdayLogs = await prisma.stepLog.findFirst({
    where: {
      userId,
      loggedAt: { gte: yesterday, lt: today },
    },
  });

  // Check if user already logged steps today
  const todayLogs = await prisma.stepLog.findFirst({
    where: {
      userId,
      loggedAt: { gte: today },
    },
  });

  let newStreak = user.currentStreak;

  if (yesterdayLogs) {
    // Streak continues or starts
    if (!todayLogs || todayLogs.steps === 0) {
      newStreak += 1;
    }
  } else {
    // Reset streak if no activity yesterday (unless today is first log)
    if (todayLogs && todayLogs.steps > 0 && user.currentStreak === 0) {
      newStreak = 1;
    } else if (!todayLogs) {
      newStreak = 0;
    }
  }

  const longestStreak = Math.max(user.longestStreak, newStreak);

  await prisma.user.update({
    where: { id: userId },
    data: { currentStreak: newStreak, longestStreak },
  });
}

async function checkAchievements(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      achievements: { include: { achievement: true } },
      _count: { enrollments: true },
    },
  });

  if (!user) return;

  for (const ua of user.achievements) {
    if (ua.completed) continue;

    let progress = 0;
    switch (ua.achievement.requirementType) {
      case 'TOTAL_STEPS':
        progress = user.totalSteps;
        break;
      case 'STREAK_DAYS':
        progress = user.currentStreak;
        break;
      case 'CHALLENGES_COMPLETED':
        progress = user._count.enrollments;
        break;
      case 'MONEY_EARNED':
        progress = user.totalEarned.toNumber();
        break;
      case 'LEVEL_REACHED':
        progress = user.level;
        break;
    }

    const completed = progress >= ua.achievement.requirementValue;

    if (completed) {
      await prisma.userAchievement.update({
        where: { id: ua.id },
        data: {
          progress,
          completed: true,
          completedAt: new Date(),
        },
      });

      // Award XP and coins
      await prisma.user.update({
        where: { id: userId },
        data: {
          xp: { increment: ua.achievement.xpReward },
          walletBalance: { increment: ua.achievement.coinReward },
        },
      });

      // Create notification
      await prisma.notification.create({
        data: {
          userId,
          title: 'Achievement Unlocked!',
          body: `You've earned "${ua.achievement.name}"! +${ua.achievement.xpReward} XP`,
          type: 'ACHIEVEMENT',
          data: { achievementId: ua.achievementId },
        },
      });
    } else if (progress !== ua.progress) {
      await prisma.userAchievement.update({
        where: { id: ua.id },
        data: { progress },
      });
    }
  }
}

export { router as stepRouter };
