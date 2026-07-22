import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../store';
import { glassmorphicGradient, neumorphicShadows } from '../utils/theme';

interface GlassmorphicCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  borderRadius?: number;
  colors?: string[];
}

export const GlassmorphicCard: React.FC<GlassmorphicCardProps> = ({
  children,
  style,
  borderRadius = 24,
  colors,
}) => {
  const { theme } = useStore();
  const gradient = glassmorphicGradient(theme);

  return (
    <View
      style={[
        {
          borderRadius,
          overflow: 'hidden',
          ...neumorphicShadows(theme, 'soft'),
        },
        style,
      ]}
    >
      <LinearGradient
        colors={colors || gradient.colors}
        start={gradient.start}
        end={gradient.end}
        style={{
          padding: 20,
          borderRadius,
          borderWidth: 1,
          borderColor: theme.glassBorder,
        }}
      >
        {children}
      </LinearGradient>
    </View>
  );
};

export default GlassmorphicCard;
