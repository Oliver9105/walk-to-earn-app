import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useStore } from '../store';
import { textStyles } from '../utils/theme';

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  showPercentage?: boolean;
  label?: string;
  color?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 120,
  strokeWidth = 10,
  showPercentage = true,
  label,
  color,
}) => {
  const { theme } = useStore();
  const styles = textStyles(theme);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const ringColor = color || theme.accent;

  return (
    <View style={[localStyles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={localStyles.svg}>
        {/* Background ring */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.surfaceShadow}
          strokeWidth={strokeWidth}
          fill="none"
          opacity={0.3}
        />
        {/* Progress ring */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={localStyles.textContainer}>
        {showPercentage && (
          <Text style={[styles.heading2, { fontSize: size * 0.22, color: theme.textPrimary }]}>
            {Math.round(progress)}%
          </Text>
        )}
        {label && (
          <Text style={[styles.small, { fontSize: size * 0.1 }]}>{label}</Text>
        )}
      </View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  svg: {
    position: 'absolute',
  },
  textContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProgressRing;
