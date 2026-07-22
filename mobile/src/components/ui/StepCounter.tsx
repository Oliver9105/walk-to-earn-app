import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useStore } from '../store';
import { neumorphicCircle, textStyles } from '../utils/theme';

interface StepCounterProps {
  steps: number;
  goal: number;
  size?: number;
}

export const StepCounter: React.FC<StepCounterProps> = ({
  steps,
  goal,
  size = 200,
}) => {
  const { theme } = useStore();
  const styles = textStyles(theme);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const progress = Math.min((steps / goal) * 100, 100);

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: progress,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  }, [progress]);

  const scale = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [0.85, 1.15],
  });

  return (
    <View style={localStyles.container}>
      <Animated.View
        style={[
          neumorphicCircle(theme, size),
          { transform: [{ scale }] },
        ]}
      >
        <View style={[localStyles.innerCircle, { width: size * 0.75, height: size * 0.75, borderRadius: size * 0.375 }]}>
          <Text style={[styles.heading1, { fontSize: size * 0.18, color: theme.accent }]}>
            {steps.toLocaleString()}
          </Text>
          <Text style={[styles.caption, { color: theme.textMuted }]}>
            / {goal.toLocaleString()}
          </Text>
          <Text style={[styles.small, { marginTop: 4, color: theme.textSecondary }]}>
            steps today
          </Text>
        </View>
      </Animated.View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  innerCircle: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
});

export default StepCounter;
