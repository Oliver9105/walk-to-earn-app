import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types';
import { AppError } from './errorHandler';
import { prisma } from '../server';

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload & { fullName: string; walletBalance: number };
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401);
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'fallback-secret';

    const decoded = jwt.verify(token, secret) as JWTPayload;

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, phoneNumber: true, fullName: true, walletBalance: true },
    });

    if (!user) {
      throw new AppError('User not found', 401);
    }

    req.user = {
      ...decoded,
      fullName: user.fullName,
      walletBalance: user.walletBalance.toNumber(),
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const secret = process.env.JWT_SECRET || 'fallback-secret';
      const decoded = jwt.verify(token, secret) as JWTPayload;

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, phoneNumber: true, fullName: true, walletBalance: true },
      });

      if (user) {
        req.user = {
          ...decoded,
          fullName: user.fullName,
          walletBalance: user.walletBalance.toNumber(),
        };
      }
    }

    next();
  } catch {
    next();
  }
};
