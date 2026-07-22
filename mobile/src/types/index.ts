export interface User {
  id: string;
  phoneNumber: string;
  fullName: string;
  email?: string | null;
  avatarUrl?: string | null;
  dateOfBirth?: string | null;
  walletBalance: number;
  totalEarned: number;
  totalDeposited: number;
  totalWithdrawn: number;
  totalSteps: number;
  currentStreak: number;
  longestStreak: number;
  dailyGoal: number;
  level: number;
  xp: number;
  rank: string;
  kycVerified: boolean;
  twoFactorEnabled: boolean;
  globalRank?: number;
  createdAt?: string;
}

export interface WalletTransaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'ENTRY_FEE' | 'GUARANTEE_FEE' | 'REWARD' | 'BONUS' | 'REFUND' | 'PENALTY';
  amount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
  mpesaReceipt?: string;
  phoneNumber?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SPECIAL' | 'TEAM';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT' | 'LEGENDARY';
  category: 'WALKING' | 'RUNNING' | 'HIKING' | 'MARATHON' | 'SPRINT' | 'ENDURANCE';
  targetSteps: number;
  targetDays: number;
  minDailySteps: number;
  entryFee: number;
  guaranteeFee: number;
  totalPrizePool: number;
  maxParticipants: number;
  baseMultiplier: number;
  bonusMultiplier: number;
  milestoneRewards: MilestoneReward[];
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  status: 'DRAFT' | 'OPEN' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  featured: boolean;
  participantCount?: number;
  leaderboard?: LeaderboardEntry[];
  createdAt?: string;
}

export interface MilestoneReward {
  percentage: number;
  reward: number;
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

export interface UserChallenge {
  id: string;
  userId: string;
  challengeId: string;
  currentSteps: number;
  currentDay: number;
  dailySteps: number[];
  milestonesReached: number[];
  status: 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'FORFEITED' | 'DISQUALIFIED';
  completedAt?: string;
  earnedAmount: number;
  bonusEarned: number;
  entryFeePaid: number;
  guaranteePaid: number;
  enrolledAt: string;
  updatedAt: string;
  lastStepLoggedAt?: string;
  challenge?: Challenge;
}

export interface StepLog {
  id: string;
  steps: number;
  distance?: number;
  duration?: number;
  calories?: number;
  latitude?: number;
  longitude?: number;
  loggedAt: string;
  confidence: number;
  flagged: boolean;
}

export interface DailyStats {
  steps: number;
  distance: number;
  calories: number;
  duration: number;
  goalProgress: number;
}

export interface WeeklyStep {
  date: string;
  steps: number;
}

export interface StepHistory {
  today: DailyStats;
  totalSteps: number;
  currentStreak: number;
  dailyGoal: number;
  level: number;
  xp: number;
  weeklySteps: WeeklyStep[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  progress: number;
  requirementValue: number;
  completed: boolean;
  completedAt?: string;
  xpReward: number;
  coinReward: number;
  badgeColor: string;
  rarity: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: 'TRANSACTION' | 'CHALLENGE' | 'ACHIEVEMENT' | 'SYSTEM' | 'REMINDER' | 'REWARD';
  data?: any;
  read: boolean;
  readAt?: string;
  createdAt: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AppState {
  isOnline: boolean;
  currentRoute: string;
  notifications: NotificationItem[];
  unreadCount: number;
}

export interface NeumorphicTheme {
  background: string;
  surface: string;
  surfaceHighlight: string;
  surfaceShadow: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentLight: string;
  accentDark: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  glassBackground: string;
  glassBorder: string;
  glassShadow: string;
}

export const defaultTheme: NeumorphicTheme = {
  background: '#E8ECF1',
  surface: '#E8ECF1',
  surfaceHighlight: '#FFFFFF',
  surfaceShadow: '#B8B9BE',
  textPrimary: '#2D3436',
  textSecondary: '#636E72',
  textMuted: '#B2BEC3',
  accent: '#6C5CE7',
  accentLight: '#A29BFE',
  accentDark: '#5B4BC4',
  success: '#00B894',
  warning: '#FDCB6E',
  error: '#E17055',
  info: '#74B9FF',
  glassBackground: 'rgba(232, 236, 241, 0.7)',
  glassBorder: 'rgba(255, 255, 255, 0.4)',
  glassShadow: 'rgba(184, 185, 190, 0.3)',
};

export const darkTheme: NeumorphicTheme = {
  background: '#2D3436',
  surface: '#2D3436',
  surfaceHighlight: '#3D4446',
  surfaceShadow: '#1D2426',
  textPrimary: '#F5F6FA',
  textSecondary: '#DCDDE1',
  textMuted: '#7F8FA6',
  accent: '#A29BFE',
  accentLight: '#C4BFE8',
  accentDark: '#6C5CE7',
  success: '#55EFC4',
  warning: '#FFEAA7',
  error: '#FF7675',
  info: '#74B9FF',
  glassBackground: 'rgba(45, 52, 54, 0.7)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  glassShadow: 'rgba(0, 0, 0, 0.3)',
};
