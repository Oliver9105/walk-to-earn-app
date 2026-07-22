import { Router } from 'express';
import { z } from 'zod';
import { mpesaService } from '../utils/mpesa';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { AppError } from '../middleware/errorHandler';
import { prisma } from '../server';

const router = Router();

const stkPushSchema = z.object({
  phoneNumber: z.string().min(10).max(15),
  amount: z.number().min(10).max(150000),
  description: z.string().optional(),
});

// Initiate STK Push deposit
router.post('/deposit', authenticate, validate(stkPushSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { phoneNumber, amount, description } = req.body;
    const userId = req.user!.userId;

    const result = await mpesaService.initiateSTKPush(
      userId,
      phoneNumber,
      amount,
      description || 'Wallet Deposit'
    );

    res.json({
      success: true,
      message: 'STK Push initiated. Check your phone to complete payment.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// M-Pesa callback endpoint (public, secured by secret)
router.post('/callback', async (req, res, next) => {
  try {
    const secret = req.query.secret as string;
    const transactionId = req.query.txId as string;
    const clientIp = req.ip || req.socket.remoteAddress || '';

    // Validate callback secret
    if (!mpesaService.validateCallbackSecret(secret)) {
      throw new AppError('Invalid callback secret', 403);
    }

    // Validate source IP (optional in development)
    if (!mpesaService.validateCallbackSource(clientIp)) {
      console.warn(`Callback from unauthorized IP: ${clientIp}`);
    }

    if (!transactionId) {
      throw new AppError('Transaction ID missing', 400);
    }

    // Process the callback
    const result = await mpesaService.processCallback(transactionId, req.body);

    // Always respond with success to Safaricom
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error) {
    // Still return success to Safaricom to prevent retries
    console.error('Callback processing error:', error);
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
});

// Query transaction status
router.get('/status/:transactionId', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user!.userId;

    const transaction = await prisma.walletTransaction.findFirst({
      where: { id: transactionId, userId },
    });

    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    // If still pending and has checkoutRequestId, query M-Pesa
    if (transaction.status === 'PENDING' && transaction.checkoutRequestId) {
      try {
        const mpesaStatus = await mpesaService.queryTransactionStatus(transaction.checkoutRequestId);
        // Update based on response if needed
      } catch {
        // Ignore query errors
      }
    }

    res.json({
      success: true,
      data: {
        id: transaction.id,
        status: transaction.status,
        amount: transaction.amount,
        type: transaction.type,
        description: transaction.description,
        mpesaReceipt: transaction.mpesaReceipt,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get all M-Pesa transactions for user
router.get('/transactions', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const [transactions, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.walletTransaction.count({ where: { userId } }),
    ]);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as mpesaRouter };
