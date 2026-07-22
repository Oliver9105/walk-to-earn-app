import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { api } from '../services/api';
import { textStyles, screenContainer } from '../utils/theme';
import NeumorphicCard from '../components/ui/NeumorphicCard';
import NeumorphicButton from '../components/ui/NeumorphicButton';
import NeumorphicInput from '../components/ui/NeumorphicInput';
import { RootStackParamList } from '../../App';

export default function ProfileSettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, user, setUser, toggleTheme, isDarkMode } = useStore();
  const styles = textStyles(theme);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [dailyGoal, setDailyGoal] = useState(user?.dailyGoal?.toString() || '10000');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await api.updateProfile({ fullName, email: email || null, dailyGoal: parseInt(dailyGoal) });
      if (response.data) {
        setUser({ ...user!, fullName, email: email || null, dailyGoal: parseInt(dailyGoal) });
        Alert.alert('Success', 'Profile updated');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[screenContainer(theme), { flex: 1 }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.heading1, { color: theme.textPrimary }]}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <NeumorphicCard style={{ alignItems: 'center', paddingVertical: 24 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: theme.accent + '20', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 40 }}>👤</Text>
          </View>
          <Text style={[styles.heading3, { marginTop: 12, color: theme.textPrimary }]}>{user?.fullName}</Text>
          <Text style={[styles.caption, { color: theme.textMuted }]}>{user?.phoneNumber}</Text>
        </NeumorphicCard>
        <Text style={[styles.heading3, { marginTop: 16, marginBottom: 12, color: theme.textPrimary }]}>Profile</Text>
        <NeumorphicInput label="Full Name" value={fullName} onChangeText={setFullName} icon={<Ionicons name="person-outline" size={20} color={theme.textMuted} />} />
        <NeumorphicInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" icon={<Ionicons name="mail-outline" size={20} color={theme.textMuted} />} />
        <NeumorphicInput label="Daily Step Goal" value={dailyGoal} onChangeText={setDailyGoal} keyboardType="numeric" icon={<Ionicons name="footsteps-outline" size={20} color={theme.textMuted} />} />
        <Text style={[styles.heading3, { marginTop: 16, marginBottom: 12, color: theme.textPrimary }]}>Preferences</Text>
        <NeumorphicCard style={{ marginBottom: 10, paddingVertical: 4 }} pressed>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name={isDarkMode ? "moon" : "sunny"} size={22} color={theme.accent} />
              <Text style={[styles.body, { marginLeft: 12, fontWeight: '600', color: theme.textPrimary }]}>Dark Mode</Text>
            </View>
            <Switch value={isDarkMode} onValueChange={toggleTheme} trackColor={{ false: theme.surfaceShadow, true: theme.accent }} thumbColor="#FFFFFF" />
          </View>
        </NeumorphicCard>
        <NeumorphicCard style={{ marginBottom: 10, paddingVertical: 4 }} pressed>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="notifications-outline" size={22} color={theme.warning} />
              <Text style={[styles.body, { marginLeft: 12, fontWeight: '600', color: theme.textPrimary }]}>Push Notifications</Text>
            </View>
            <Switch value={true} trackColor={{ false: theme.surfaceShadow, true: theme.accent }} thumbColor="#FFFFFF" />
          </View>
        </NeumorphicCard>
        <NeumorphicButton title={saving ? 'Saving...' : 'Save Changes'} onPress={handleSave} disabled={saving} size="large" style={{ marginTop: 24 }} />
      </ScrollView>
    </View>
  );
}
