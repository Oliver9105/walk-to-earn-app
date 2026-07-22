import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { useStore } from '../store';
import { neumorphicContainer, neumorphicInset } from '../utils/theme';

interface NeumorphicCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  pressed?: boolean;
  onPress?: () => void;
  borderRadius?: number;
  intensity?: 'soft' | 'medium' | 'hard';
}

export const NeumorphicCard: React.FC<NeumorphicCardProps> = ({
  children,
  style,
  pressed = false,
  onPress,
  borderRadius = 20,
  intensity = 'medium',
}) => {
  const { theme } = useStore();

  const containerStyle = pressed
    ? [neumorphicInset(theme, intensity), { borderRadius, backgroundColor: theme.surface }]
    : [neumorphicContainer(theme, borderRadius), { backgroundColor: theme.surface }];

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        style={[containerStyle, styles.card, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[containerStyle, styles.card, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 20,
  },
});

export default NeumorphicCard;
