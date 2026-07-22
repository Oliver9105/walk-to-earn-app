import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useStore } from '../store';
import { neumorphicShadows, neumorphicInset, textStyles } from '../utils/theme';

interface NeumorphicButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const NeumorphicButton: React.FC<NeumorphicButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const { theme } = useStore();
  const [pressed, setPressed] = useState(false);

  const getVariantColors = () => {
    switch (variant) {
      case 'primary':
        return { bg: theme.accent, text: '#FFFFFF', shadow: theme.accentDark };
      case 'secondary':
        return { bg: theme.surface, text: theme.accent, shadow: theme.surfaceShadow };
      case 'danger':
        return { bg: theme.error, text: '#FFFFFF', shadow: '#C0392B' };
      case 'success':
        return { bg: theme.success, text: '#FFFFFF', shadow: '#00A884' };
      case 'ghost':
        return { bg: 'transparent', text: theme.accent, shadow: 'transparent' };
      default:
        return { bg: theme.accent, text: '#FFFFFF', shadow: theme.accentDark };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { paddingVertical: 10, paddingHorizontal: 16, fontSize: 14 };
      case 'large':
        return { paddingVertical: 18, paddingHorizontal: 32, fontSize: 18 };
      default:
        return { paddingVertical: 14, paddingHorizontal: 24, fontSize: 16 };
    }
  };

  const colors = getVariantColors();
  const sizeStyles = getSizeStyles();

  const buttonStyle = pressed || disabled
    ? [neumorphicInset(theme, 'medium'), { backgroundColor: colors.bg }]
    : [neumorphicShadows(theme, 'medium'), { backgroundColor: colors.bg, shadowColor: colors.shadow }];

  return (
    <TouchableOpacity
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        localStyles.button,
        buttonStyle,
        {
          borderRadius: 16,
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {icon}
      <Text
        style={[
          localStyles.buttonText,
          { color: colors.text, fontSize: sizeStyles.fontSize },
          textStyle,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const localStyles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default NeumorphicButton;
