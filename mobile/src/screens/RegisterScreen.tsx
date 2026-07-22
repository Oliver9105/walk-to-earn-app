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

export default function RegisterScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, setUser, setAuthenticated } = useStore();
  const styles = textStyles(theme);

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !phoneNumber || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.register({
        fullName,
        phoneNumber,
        password,
        email: email || undefined,
      });

      if (response.data?.user) {
        setUser(response.data.user);
        setAuthenticated(true);
      }
    } catch (error: any) {
      Alert.alert(
        'Registration Failed',
        error.response?.data?.error || 'Something went wrong. Please try again.'
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
              <Ionicons name="person-add-outline" size={40} color={theme.accent} />
            </View>
            <Text style={[styles.heading1, localStyles.title]}>Create Account</Text>
            <Text style={[styles.body, localStyles.subtitle]}>
              Start earning with every step you take
            </Text>
          </View>

          <View style={localStyles.form}>
            <NeumorphicInput
              label="Full Name *"
              placeholder="John Doe"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              icon={<Ionicons name="person-outline" size={20} color={theme.textMuted} />}
            />

            <NeumorphicInput
              label="Phone Number *"
              placeholder="+254 7XX XXX XXX"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              icon={<Ionicons name="call-outline" size={20} color={theme.textMuted} />}
            />

            <NeumorphicInput
              label="Email (Optional)"
              placeholder="john@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              icon={<Ionicons name="mail-outline" size={20} color={theme.textMuted} />}
            />

            <NeumorphicInput
              label="Password *"
              placeholder="Min 6 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              icon={<Ionicons name="lock-closed-outline" size={20} color={theme.textMuted} />}
            />

            <NeumorphicInput
              label="Confirm Password *"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              icon={<Ionicons name="shield-checkmark-outline" size={20} color={theme.textMuted} />}
            />

            <NeumorphicButton
              title={isLoading ? 'Creating Account...' : 'Create Account'}
              onPress={handleRegister}
              disabled={isLoading}
              size="large"
              style={{ marginTop: 8 }}
            />
          </View>

          <View style={localStyles.footer}>
            <Text style={[styles.body, localStyles.footerText]}>
              Already have an account?
            </Text>
            <NeumorphicButton
              title="Sign In"
              onPress={() => navigation.navigate('Login')}
              variant="ghost"
              size="small"
              style={{ marginTop: 8 }}
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
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
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
