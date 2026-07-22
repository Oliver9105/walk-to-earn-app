import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useStore } from '../store';
import { statusBadge, textStyles } from '../utils/theme';

interface StatusBadgeProps {
  status: string;
  size?: 'small' | 'medium';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'medium' }) => {
  const { theme } = useStore();
  const styles = textStyles(theme);

  return (
    <View style={[statusBadge(theme, status), size === 'small' && localStyles.small]}>
      <Text style={[styles.small, localStyles.text, size === 'small' && { fontSize: 10 }]}>
        {status}
      </Text>
    </View>
  );
};

const localStyles = StyleSheet.create({
  small: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  text: {
    textTransform: 'capitalize',
    fontWeight: '700',
  },
});

export default StatusBadge;
