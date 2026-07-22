import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { AppError } from '../middleware/errorHandler';
import { prisma } from '../server';
import { TransactionType, TransactionStatus } from '@prisma/client';

const router = Router();

const withdrawalSchema = z.object({
  phoneNumber: z.string().min(10).max(15),
  amount: z.number().min(50).max(150000),
});

// Get wallet balance and stats
router.get('/balance', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        walletBalance: true,
        totalEarned: true,
        totalDeposited: true,
        totalWithdrawn: true,
      },
    });

    const stats = await prisma.walletTransaction.groupBy({
      by: ['type', 'status'],
      where: { userId: req.user!.userId },
      _sum: { amount: true },
      _count: { id: true },
    });

    res.json({
      success: true,
      data: {
        balance: user?.walletBalance,
        totalEarned: user?.totalEarned,
        totalDeposited: user?.totalDeposited,
        totalWithdrawn: user?.totalWithdrawn,
        stats,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get transaction history
router.get('/transactions', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const type = req.query.type as string;
    const status = req.query.status as string;

    const where: any = { userId: req.user!.userId };
    if (type) where.type = type;
    if (status) where.status = status;

    const [transactions, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.walletTransaction.count({ where }),
    ]);

    res.json({
      success: true,
      data: transactions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
});

// Request withdrawal (B2C - would need separate implementation)
router.post('/withdraw', authenticate, validate(withdrawalSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { phoneNumber, amount } = req.body;
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || user.walletBalance.toNumber() < amount) {
      throw new AppError('Insufficient balance', 400);
    }

    // Create withdrawal transaction
    const transaction = await prisma.walletTransaction.create({
      data: {
        userId,
        type: TransactionType.WITHDRAWAL,
        amount,
        status: TransactionStatus.PENDING,
        phoneNumber,
        description: 'Wallet Withdrawal',
      },
    });

    // Deduct from balance
    await prisma.user.update({
      where: { id: userId },
      data: {
        walletBalance: { decrement: amount },
        totalWithdrawn: { increment: amount },
      },
    });

    res.json({
      success: true,
      message: 'Withdrawal request submitted for processing',
      data: { transactionId: transaction.id, amount, status: 'PENDING' },
    });
  } catch (error) {
    next(error);
  }
});

export { router as walletRouter };
