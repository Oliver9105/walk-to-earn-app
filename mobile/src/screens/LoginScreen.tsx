import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { api } from '../services/api';
import { textStyles, screenContainer } from '../utils/theme';
import NeumorphicInput from '../components/ui/NeumorphicInput';
import NeumorphicButton from '../components/ui/NeumorphicButton';
import { RootStackParamList } from '../../App';

export default function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, setUser, setAuthenticated } = useStore();
  const styles = textStyles(theme);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!phoneNumber || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.login({ phoneNumber, password });
      if (response.data?.user) {
        setUser(response.data.user);
        setAuthenticated(true);
      }
    } catch (error: any) {
      Alert.alert(
        'Login Failed',
        error.response?.data?.error || 'Invalid phone number or password'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[screenContainer(theme), localStyles.container]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={localStyles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={localStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={localStyles.header}>
            <View style={[localStyles.iconContainer, { backgroundColor: theme.accent + '20' }]}>
              <Ionicons name="log-in-outline" size={40} color={theme.accent} />
            </View>
            <Text style={[styles.heading1, localStyles.title]}>Welcome Back</Text>
            <Text style={[styles.body, localStyles.subtitle]}>
              Sign in to continue your walking journey
            </Text>
          </View>

          <View style={localStyles.form}>
            <NeumorphicInput
              label="Phone Number"
              placeholder="+254 7XX XXX XXX"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              icon={<Ionicons name="call-outline" size={20} color={theme.textMuted} />}
            />

            <NeumorphicInput
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              icon={<Ionicons name="lock-closed-outline" size={20} color={theme.textMuted} />}
            />

            <NeumorphicButton
              title={isLoading ? 'Signing In...' : 'Sign In'}
              onPress={handleLogin}
              disabled={isLoading}
              size="large"
              style={{ marginTop: 8 }}
            />

            <NeumorphicButton
              title="Forgot Password?"
              onPress={() => Alert.alert('Coming Soon', 'Password reset will be available soon.')}
              variant="ghost"
              size="small"
              style={{ marginTop: 8 }}
            />
          </View>

          <View style={localStyles.footer}>
            <Text style={[styles.body, localStyles.footerText]}>
              Don't have an account?
            </Text>
            <NeumorphicButton
              title="Create Account"
              onPress={() => navigation.navigate('Register')}
              variant="secondary"
              size="medium"
              style={{ marginTop: 12 }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  form: {
    marginBottom: 24,
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 20,
  },
  footerText: {
    textAlign: 'center',
  },
});
