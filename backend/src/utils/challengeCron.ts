import cron from 'node-cron';
import { prisma } from '../server';
import { UserChallengeStatus, TransactionType, TransactionStatus } from '@prisma/client';

export function setupChallengeCronJobs() {
  // Check for challenge start/end every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log('Running challenge status cron job...');
    const now = new Date();

    try {
      // Start challenges that should be active
      await prisma.challenge.updateMany({
        where: {
          status: 'OPEN',
          startDate: { lte: now },
        },
        data: { status: 'ACTIVE' },
      });

      // Complete challenges that have ended
      const completedChallenges = await prisma.challenge.findMany({
        where: {
          status: 'ACTIVE',
          endDate: { lte: now },
        },
        include: { enrollments: true },
      });

      for (const challenge of completedChallenges) {
        await prisma.challenge.update({
          where: { id: challenge.id },
          data: { status: 'COMPLETED' },
        });

        // Process remaining active enrollments
        for (const enrollment of challenge.enrollments) {
          if (enrollment.status === 'ACTIVE') {
            const progress = enrollment.currentSteps / challenge.targetSteps;

            if (progress >= 0.8) {
              // Consider as completed with partial reward
              await prisma.userChallenge.update({
                where: { id: enrollment.id },
                data: { status: 'COMPLETED', completedAt: now },
              });

              const partialReward = enrollment.earnedAmount.toNumber();
              if (partialReward > 0) {
                await prisma.user.update({
                  where: { id: enrollment.userId },
                  data: {
                    walletBalance: { increment: partialReward },
                    totalEarned: { increment: partialReward },
                  },
                });
              }
            } else {
              // Mark as failed
              await prisma.userChallenge.update({
                where: { id: enrollment.id },
                data: { status: 'FAILED' },
              });

              // Forfeit guarantee
              if (enrollment.guaranteePaid.toNumber() > 0) {
                await prisma.walletTransaction.create({
                  data: {
                    userId: enrollment.userId,
                    type: TransactionType.PENALTY,
                    amount: enrollment.guaranteePaid,
                    status: TransactionStatus.COMPLETED,
                    description: `Guarantee forfeited for ${challenge.title}`,
                  },
                });
              }
            }
          }
        }
      }

      // Reset daily steps for new day
      await resetDailySteps();

    } catch (error) {
      console.error('Challenge cron job error:', error);
    }
  });

  // Daily streak check at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('Running daily streak check...');

    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const today = new Date(yesterday);
      today.setDate(today.getDate() + 1);

      // Find users who didn't log steps yesterday
      const usersWithStreak = await prisma.user.findMany({
        where: { currentStreak: { gt: 0 } },
      });

      for (const user of usersWithStreak) {
        const yesterdayLogs = await prisma.stepLog.findFirst({
          where: {
            userId: user.id,
            loggedAt: { gte: yesterday, lt: today },
          },
        });

        if (!yesterdayLogs) {
          await prisma.user.update({
            where: { id: user.id },
            data: { currentStreak: 0 },
          });

          await prisma.notification.create({
            data: {
              userId: user.id,
              title: 'Streak Broken',
              body: 'You missed a day! Your step streak has been reset. Start a new streak today!',
              type: 'REMINDER',
            },
          });
        }
      }
    } catch (error) {
      console.error('Streak cron job error:', error);
    }
  });
}

async function resetDailySteps() {
  // This is handled per-challenge in the enrollment records
  // Daily steps array is already structured for this
}
