import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { validate, validateQuery } from '../middleware/validation';
import { AppError } from '../middleware/errorHandler';
import { prisma } from '../server';
import { TransactionType, TransactionStatus, UserChallengeStatus } from '@prisma/client';

const router = Router();

const listQuerySchema = z.object({
  status: z.string().optional(),
  category: z.string().optional(),
  difficulty: z.string().optional(),
  featured: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

const enrollSchema = z.object({
  challengeId: z.string().uuid(),
  useGuarantee: z.boolean().optional(),
});

const logStepsSchema = z.object({
  userChallengeId: z.string().uuid(),
  steps: z.number().min(1).max(50000),
  distance: z.number().optional(),
  duration: z.number().optional(),
  calories: z.number().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

// List challenges
router.get('/', validateQuery(listQuerySchema), async (req, res, next) => {
  try {
    const { status, category, difficulty, featured, page, limit } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;

    const where: any = { status: status || 'OPEN' };
    if (category) where.category = category;
    if (difficulty) where.difficulty = difficulty;
    if (featured === 'true') where.featured = true;

    const [challenges, total] = await Promise.all([
      prisma.challenge.findMany({
        where,
        orderBy: [{ featured: 'desc' }, { startDate: 'asc' }],
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: {
          _count: { select: { enrollments: true } },
        },
      }),
      prisma.challenge.count({ where }),
    ]);

    res.json({
      success: true,
      data: challenges.map(c => ({
        ...c,
        participantCount: c._count.enrollments,
        _count: undefined,
      })),
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    next(error);
  }
});

// Get challenge details
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const challenge = await prisma.challenge.findUnique({
      where: { id },
      include: {
        _count: { select: { enrollments: true } },
        enrollments: {
          take: 10,
          orderBy: { currentSteps: 'desc' },
          include: {
            user: { select: { fullName: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!challenge) {
      throw new AppError('Challenge not found', 404);
    }

    res.json({
      success: true,
      data: {
        ...challenge,
        participantCount: challenge._count.enrollments,
        leaderboard: challenge.enrollments.map((e, i) => ({
          rank: i + 1,
          fullName: e.user.fullName,
          avatarUrl: e.user.avatarUrl,
          currentSteps: e.currentSteps,
          currentDay: e.currentDay,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Enroll in a challenge
router.post('/enroll', authenticate, validate(enrollSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { challengeId, useGuarantee } = req.body;
    const userId = req.user!.userId;

    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw new AppError('Challenge not found', 404);
    }

    if (challenge.status !== 'OPEN') {
      throw new AppError('Challenge is not open for enrollment', 400);
    }

    if (new Date() > challenge.registrationDeadline) {
      throw new AppError('Registration deadline has passed', 400);
    }

    // Check if already enrolled
    const existing = await prisma.userChallenge.findUnique({
      where: { userId_challengeId: { userId, challengeId } },
    });

    if (existing) {
      throw new AppError('Already enrolled in this challenge', 409);
    }

    // Check participant limit
    const participantCount = await prisma.userChallenge.count({
      where: { challengeId },
    });

    if (participantCount >= challenge.maxParticipants) {
      throw new AppError('Challenge is full', 400);
    }

    // Check wallet balance
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const totalFee = challenge.entryFee.toNumber() + (useGuarantee ? challenge.guaranteeFee.toNumber() : 0);

    if (user!.walletBalance.toNumber() < totalFee) {
      throw new AppError(`Insufficient balance. Required: KES ${totalFee}`, 400);
    }

    // Deduct fees
    await prisma.user.update({
      where: { id: userId },
      data: { walletBalance: { decrement: totalFee } },
    });

    // Create entry fee transaction
    await prisma.walletTransaction.create({
      data: {
        userId,
        type: TransactionType.ENTRY_FEE,
        amount: challenge.entryFee,
        status: TransactionStatus.COMPLETED,
        description: `Entry fee for ${challenge.title}`,
      },
    });

    // Create guarantee fee transaction if applicable
    if (useGuarantee) {
      await prisma.walletTransaction.create({
        data: {
          userId,
          type: TransactionType.GUARANTEE_FEE,
          amount: challenge.guaranteeFee,
          status: TransactionStatus.COMPLETED,
          description: `Guarantee fee for ${challenge.title}`,
        },
      });
    }

    // Create enrollment
    const enrollment = await prisma.userChallenge.create({
      data: {
        userId,
        challengeId,
        entryFeePaid: challenge.entryFee,
        guaranteePaid: useGuarantee ? challenge.guaranteeFee : 0,
        dailySteps: Array(challenge.targetDays).fill(0),
      },
    });

    // Update challenge prize pool
    await prisma.challenge.update({
      where: { id: challengeId },
      data: { totalPrizePool: { increment: totalFee } },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId,
        title: 'Challenge Enrolled!',
        body: `You've joined "${challenge.title}". Good luck!`,
        type: 'CHALLENGE',
        data: { challengeId, enrollmentId: enrollment.id },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in challenge',
      data: enrollment,
    });
  } catch (error) {
    next(error);
  }
});

// Get user's enrolled challenges
router.get('/my/enrolled', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const status = req.query.status as string;

    const where: any = { userId };
    if (status) where.status = status;

    const enrollments = await prisma.userChallenge.findMany({
      where,
      orderBy: { enrolledAt: 'desc' },
      include: {
        challenge: true,
      },
    });

    res.json({ success: true, data: enrollments });
  } catch (error) {
    next(error);
  }
});

// Log steps for a challenge
router.post('/log-steps', authenticate, validate(logStepsSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { userChallengeId, steps, distance, duration, calories, latitude, longitude } = req.body;
    const userId = req.user!.userId;

    const enrollment = await prisma.userChallenge.findFirst({
      where: { id: userChallengeId, userId },
      include: { challenge: true },
    });

    if (!enrollment) {
      throw new AppError('Enrollment not found', 404);
    }

    if (enrollment.status !== 'ACTIVE') {
      throw new AppError('Challenge is not active', 400);
    }

    // Validate step logging frequency
    const minInterval = parseInt(process.env.MIN_STEP_INTERVAL_MS || '500');
    if (enrollment.lastStepLoggedAt && 
        new Date().getTime() - enrollment.lastStepLoggedAt.getTime() < minInterval) {
      throw new AppError('Please wait before logging more steps', 429);
    }

    // Validate max daily steps
    const maxDaily = parseInt(process.env.MAX_DAILY_STEPS || '50000');
    const todaySteps = enrollment.dailySteps[enrollment.currentDay - 1] || 0;
    if (todaySteps + steps > maxDaily) {
      throw new AppError('Daily step limit exceeded', 400);
    }

    // Fraud detection (basic)
    const confidence = calculateStepConfidence(steps, duration, distance);
    const flagged = confidence < parseFloat(process.env.STEP_FRAUD_THRESHOLD || '0.95');

    // Update enrollment
    const newDailySteps = [...enrollment.dailySteps];
    newDailySteps[enrollment.currentDay - 1] = todaySteps + steps;
    const newTotalSteps = enrollment.currentSteps + steps;

    // Check milestones
    const milestones = enrollment.challenge.milestoneRewards as any[];
    const milestonesReached = [...enrollment.milestonesReached];
    let earnedAmount = enrollment.earnedAmount.toNumber();
    let bonusEarned = enrollment.bonusEarned.toNumber();

    for (const milestone of milestones) {
      if (!milestonesReached.includes(milestone.percentage) && 
          newTotalSteps >= (enrollment.challenge.targetSteps * milestone.percentage / 100)) {
        milestonesReached.push(milestone.percentage);
        earnedAmount += milestone.reward;

        // Create milestone notification
        await prisma.notification.create({
          data: {
            userId,
            title: 'Milestone Reached!',
            body: `You've reached ${milestone.percentage}% of ${enrollment.challenge.title} and earned KES ${milestone.reward}!`,
            type: 'REWARD',
            data: { milestone, challengeId: enrollment.challengeId },
          },
        });
      }
    }

    // Check if challenge completed
    let status = enrollment.status;
    let completedAt = enrollment.completedAt;
    if (newTotalSteps >= enrollment.challenge.targetSteps) {
      status = 'COMPLETED' as UserChallengeStatus;
      completedAt = new Date();

      // Calculate bonus based on speed
      const daysTaken = enrollment.currentDay;
      const targetDays = enrollment.challenge.targetDays;
      if (daysTaken < targetDays) {
        const speedBonus = (targetDays - daysTaken) * enrollment.challenge.bonusMultiplier.toNumber();
        bonusEarned += speedBonus;
      }

      // Update user stats
      await prisma.user.update({
        where: { id: userId },
        data: {
          totalSteps: { increment: steps },
          totalEarned: { increment: earnedAmount + bonusEarned },
          walletBalance: { increment: earnedAmount + bonusEarned },
          xp: { increment: 100 },
        },
      });

      // Create completion notification
      await prisma.notification.create({
        data: {
          userId,
          title: 'Challenge Complete!',
          body: `Congratulations! You've completed "${enrollment.challenge.title}" and earned KES ${earnedAmount + bonusEarned}!`,
          type: 'REWARD',
          data: { challengeId: enrollment.challengeId, totalEarned: earnedAmount + bonusEarned },
        },
      });
    } else {
      // Just update steps
      await prisma.user.update({
        where: { id: userId },
        data: { totalSteps: { increment: steps } },
      });
    }

    const updated = await prisma.userChallenge.update({
      where: { id: userChallengeId },
      data: {
        currentSteps: newTotalSteps,
        dailySteps: newDailySteps,
        milestonesReached,
        earnedAmount,
        bonusEarned,
        status,
        completedAt,
        lastStepLoggedAt: new Date(),
      },
    });

    // Create step log
    await prisma.stepLog.create({
      data: {
        userId,
        userChallengeId,
        steps,
        distance,
        duration,
        calories,
        latitude,
        longitude,
        confidence,
        flagged,
      },
    });

    res.json({
      success: true,
      data: {
        enrollment: updated,
        stepsAdded: steps,
        milestonesReached: milestonesReached.filter(m => !enrollment.milestonesReached.includes(m)),
        totalEarned: earnedAmount + bonusEarned,
        isCompleted: status === 'COMPLETED',
      },
    });
  } catch (error) {
    next(error);
  }
});

// Forfeit a challenge
router.post('/forfeit/:enrollmentId', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { enrollmentId } = req.params;
    const userId = req.user!.userId;

    const enrollment = await prisma.userChallenge.findFirst({
      where: { id: enrollmentId, userId },
      include: { challenge: true },
    });

    if (!enrollment) {
      throw new AppError('Enrollment not found', 404);
    }

    if (enrollment.status !== 'ACTIVE') {
      throw new AppError('Can only forfeit active challenges', 400);
    }

    // Forfeit guarantee if applicable
    let refundAmount = 0;
    if (enrollment.guaranteePaid.toNumber() > 0) {
      // Partial refund based on progress
      const progress = enrollment.currentSteps / enrollment.challenge.targetSteps;
      refundAmount = enrollment.guaranteePaid.toNumber() * (1 - progress);

      if (refundAmount > 0) {
        await prisma.user.update({
          where: { id: userId },
          data: { walletBalance: { increment: refundAmount } },
        });

        await prisma.walletTransaction.create({
          data: {
            userId,
            type: TransactionType.REFUND,
            amount: refundAmount,
            status: TransactionStatus.COMPLETED,
            description: `Partial guarantee refund for ${enrollment.challenge.title}`,
          },
        });
      }
    }

    await prisma.userChallenge.update({
      where: { id: enrollmentId },
      data: { status: 'FORFEITED' },
    });

    res.json({
      success: true,
      message: 'Challenge forfeited',
      data: { refundAmount },
    });
  } catch (error) {
    next(error);
  }
});

function calculateStepConfidence(steps: number, duration?: number, distance?: number): number {
  if (!duration || !distance) return 0.95;

  const avgStride = 0.7; // meters
  const expectedDistance = steps * avgStride;
  const distanceRatio = distance / expectedDistance;

  // Expected pace: ~100 steps per minute for walking
  const expectedDuration = steps / 100 * 60;
  const durationRatio = duration / expectedDuration;

  let confidence = 1.0;

  if (distanceRatio < 0.5 || distanceRatio > 2.0) confidence -= 0.2;
  if (durationRatio < 0.3 || durationRatio > 3.0) confidence -= 0.2;
  if (steps / (duration / 60) > 200) confidence -= 0.3; // Too fast

  return Math.max(0, confidence);
}

export { router as challengeRouter };
