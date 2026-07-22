import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../store';
import { textStyles } from '../utils/theme';

export default function SplashScreen() {
  const { theme } = useStore();
  const styles = textStyles(theme);
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={localStyles.container}>
      <LinearGradient
        colors={[theme.accent, theme.accentDark]}
        style={localStyles.gradient}
      >
        <Animated.View
          style={[
            localStyles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={localStyles.iconContainer}>
            <Text style={localStyles.icon}>👟</Text>
          </View>
          <Text style={[styles.heading1, localStyles.title, { color: '#FFFFFF' }]}>
            Walk-to-Earn
          </Text>
          <Text style={[styles.body, localStyles.subtitle, { color: 'rgba(255,255,255,0.8)' }]}>
            Walk. Earn. Repeat.
          </Text>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 36,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
  },
});
