export interface JWTPayload {
  userId: string;
  phoneNumber: string;
  iat?: number;
  exp?: number;
}

export interface MpesaSTKPushRequest {
  phoneNumber: string;
  amount: number;
  accountReference?: string;
  transactionDesc?: string;
}

export interface MpesaCallbackData {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value: string | number;
        }>;
      };
    };
  };
}

export interface StepValidationResult {
  valid: boolean;
  confidence: number;
  reason?: string;
}

export interface AchievementProgress {
  achievementId: string;
  name: string;
  description: string;
  icon: string;
  progress: number;
  requirementValue: number;
  completed: boolean;
  completedAt?: Date;
  xpReward: number;
  coinReward: number;
  badgeColor: string;
  rarity: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  fullName: string;
  avatarUrl?: string;
  totalSteps: number;
  totalEarned: number;
  level: number;
  currentStreak: number;
}
