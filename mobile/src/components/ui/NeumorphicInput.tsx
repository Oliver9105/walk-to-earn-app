import React from 'react';
import { View, TextInput, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useStore } from '../store';
import { neumorphicInset, textStyles } from '../utils/theme';

interface NeumorphicInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  icon?: React.ReactNode;
  maxLength?: number;
}

export const NeumorphicInput: React.FC<NeumorphicInputProps> = ({
  value,
  onChangeText,
  placeholder,
  label,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error,
  style,
  inputStyle,
  icon,
  maxLength,
}) => {
  const { theme } = useStore();
  const styles = textStyles(theme);

  return (
    <View style={[localStyles.container, style]}>
      {label && (
        <Text style={[styles.caption, localStyles.label]}>{label}</Text>
      )}
      <View style={[localStyles.inputContainer, neumorphicInset(theme, 'soft'), { borderRadius: 16 }]}>
        {icon && <View style={localStyles.iconContainer}>{icon}</View>}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.textMuted}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
          style={[
            localStyles.input,
            { color: theme.textPrimary },
            inputStyle,
          ]}
        />
      </View>
      {error && (
        <Text style={[localStyles.error, { color: theme.error }]}>{error}</Text>
      )}
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    marginLeft: 4,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  iconContainer: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    fontWeight: '500',
  },
  error: {
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default NeumorphicInput;
