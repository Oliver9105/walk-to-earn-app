import { StyleSheet, ViewStyle, TextStyle, Dimensions } from 'react-native';
import { NeumorphicTheme } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Neumorphism shadow styles
export const neumorphicShadows = (theme: NeumorphicTheme, intensity: 'soft' | 'medium' | 'hard' = 'medium') => {
  const shadowOffset = intensity === 'soft' ? 4 : intensity === 'medium' ? 8 : 12;
  const shadowOpacity = intensity === 'soft' ? 0.15 : intensity === 'medium' ? 0.25 : 0.35;

  return {
    shadowColor: theme.surfaceShadow,
    shadowOffset: { width: shadowOffset, height: shadowOffset },
    shadowOpacity,
    shadowRadius: shadowOffset * 1.5,
    elevation: shadowOffset,
  };
};

export const neumorphicInset = (theme: NeumorphicTheme, intensity: 'soft' | 'medium' | 'hard' = 'medium') => {
  const shadowOffset = intensity === 'soft' ? 3 : intensity === 'medium' ? 5 : 8;

  return {
    shadowColor: theme.surfaceShadow,
    shadowOffset: { width: shadowOffset, height: shadowOffset },
    shadowOpacity: 0.4,
    shadowRadius: shadowOffset,
    elevation: -shadowOffset,
  };
};

// Neumorphic container (convex - raised)
export const neumorphicContainer = (theme: NeumorphicTheme, borderRadius: number = 16): ViewStyle => ({
  backgroundColor: theme.surface,
  borderRadius,
  ...neumorphicShadows(theme),
});

// Neumorphic button (convex - raised, pressable)
export const neumorphicButton = (theme: NeumorphicTheme, borderRadius: number = 20): ViewStyle => ({
  backgroundColor: theme.surface,
  borderRadius,
  ...neumorphicShadows(theme, 'medium'),
  paddingVertical: 14,
  paddingHorizontal: 24,
  alignItems: 'center',
  justifyContent: 'center',
});

// Neumorphic input (concave - pressed in)
export const neumorphicInput = (theme: NeumorphicTheme, borderRadius: number = 16): ViewStyle => ({
  backgroundColor: theme.surface,
  borderRadius,
  paddingHorizontal: 16,
  paddingVertical: 14,
  ...neumorphicInset(theme, 'soft'),
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.2)',
});

// Neumorphic card
export const neumorphicCard = (theme: NeumorphicTheme): ViewStyle => ({
  backgroundColor: theme.surface,
  borderRadius: 24,
  padding: 20,
  marginHorizontal: 16,
  marginVertical: 8,
  ...neumorphicShadows(theme, 'medium'),
});

// Glassmorphism container
export const glassmorphicContainer = (theme: NeumorphicTheme, borderRadius: number = 20): ViewStyle => ({
  backgroundColor: theme.glassBackground,
  borderRadius,
  borderWidth: 1,
  borderColor: theme.glassBorder,
  ...neumorphicShadows(theme, 'soft'),
  overflow: 'hidden',
});

// Glassmorphic overlay for cards
export const glassmorphicOverlay = (theme: NeumorphicTheme): ViewStyle => ({
  backgroundColor: theme.glassBackground,
  borderTopWidth: 1,
  borderTopColor: theme.glassBorder,
  ...neumorphicShadows(theme, 'soft'),
});

// Pressed state (concave)
export const pressedNeumorphic = (theme: NeumorphicTheme, borderRadius: number = 16): ViewStyle => ({
  backgroundColor: theme.surface,
  borderRadius,
  ...neumorphicInset(theme, 'medium'),
});

// Circular neumorphic element
export const neumorphicCircle = (theme: NeumorphicTheme, size: number): ViewStyle => ({
  width: size,
  height: size,
  borderRadius: size / 2,
  backgroundColor: theme.surface,
  alignItems: 'center',
  justifyContent: 'center',
  ...neumorphicShadows(theme, 'medium'),
});

// Neumorphic icon button
export const neumorphicIconButton = (theme: NeumorphicTheme, size: number = 48): ViewStyle => ({
  width: size,
  height: size,
  borderRadius: size / 2,
  backgroundColor: theme.surface,
  alignItems: 'center',
  justifyContent: 'center',
  ...neumorphicShadows(theme, 'soft'),
});

// Tab bar style
export const neumorphicTabBar = (theme: NeumorphicTheme): ViewStyle => ({
  backgroundColor: theme.glassBackground,
  borderTopWidth: 1,
  borderTopColor: theme.glassBorder,
  paddingTop: 8,
  paddingBottom: 20,
  paddingHorizontal: 16,
  ...neumorphicShadows(theme, 'soft'),
});

// Gradient overlay for glassmorphism
export const glassmorphicGradient = (theme: NeumorphicTheme) => ({
  colors: [
    theme.glassBackground,
    `${theme.glassBackground}99`,
    `${theme.glassBackground}66`,
  ],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
});

// Text styles
export const textStyles = (theme: NeumorphicTheme) => ({
  heading1: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: theme.textPrimary,
    letterSpacing: -0.5,
  },
  heading2: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: theme.textPrimary,
    letterSpacing: -0.3,
  },
  heading3: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: theme.textPrimary,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: theme.textSecondary,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: theme.textMuted,
  },
  small: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: theme.textMuted,
  },
  button: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: theme.textPrimary,
  },
  accent: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: theme.accent,
  },
});

// Status badge styles
export const statusBadge = (theme: NeumorphicTheme, status: string): ViewStyle => {
  const colors: Record<string, string> = {
    PENDING: theme.warning,
    PROCESSING: theme.info,
    COMPLETED: theme.success,
    FAILED: theme.error,
    CANCELLED: theme.textMuted,
    REFUNDED: theme.info,
    ACTIVE: theme.success,
    OPEN: theme.success,
    DRAFT: theme.textMuted,
    EASY: theme.success,
    MEDIUM: theme.warning,
    HARD: theme.error,
    EXPERT: theme.error,
    LEGENDARY: theme.accent,
  };

  return {
    backgroundColor: `${colors[status] || theme.textMuted}20`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${colors[status] || theme.textMuted}40`,
  };
};

// Progress bar
export const progressBar = (theme: NeumorphicTheme, progress: number): ViewStyle => ({
  height: 8,
  borderRadius: 4,
  backgroundColor: theme.surface,
  ...neumorphicInset(theme, 'soft'),
  overflow: 'hidden',
});

export const progressFill = (theme: NeumorphicTheme, progress: number): ViewStyle => ({
  width: `${Math.min(100, Math.max(0, progress))}%`,
  height: '100%',
  borderRadius: 4,
  backgroundColor: theme.accent,
});

// Screen container
export const screenContainer = (theme: NeumorphicTheme): ViewStyle => ({
  flex: 1,
  backgroundColor: theme.background,
});

// Safe area padding
export const safePadding = {
  top: 16,
  horizontal: 20,
  bottom: 24,
};

// Animation values
export const springConfig = {
  damping: 15,
  stiffness: 150,
  mass: 1,
};

export const fadeIn = {
  from: { opacity: 0, translateY: 20 },
  to: { opacity: 1, translateY: 0 },
  config: { duration: 400 },
};
