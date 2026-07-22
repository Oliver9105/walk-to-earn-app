import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Vibration } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { api } from '../services/api';
import { textStyles, screenContainer, neumorphicCircle } from '../utils/theme';
import NeumorphicCard from '../components/ui/NeumorphicCard';
import NeumorphicButton from '../components/ui/NeumorphicButton';
import StepCounter from '../components/ui/StepCounter';
import { RootStackParamList } from '../../App';

export default function StepTrackerScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, user, myEnrollments, setStepHistory } = useStore();
  const styles = textStyles(theme);
  const [isTracking, setIsTracking] = useState(false);
  const [steps, setSteps] = useState(0);
  const [manualSteps, setManualSteps] = useState('');
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isTracking) {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isTracking]);

  const toggleTracking = () => {
    if (isTracking) {
      setIsTracking(false);
      if (steps > 0) handleLogSteps(steps);
    } else {
      setSteps(0); setDuration(0); setIsTracking(true);
    }
  };

  const handleLogSteps = async (stepCount: number) => {
    try {
      await api.logSteps({ steps: stepCount, duration });
      if (selectedChallenge) {
        await api.logChallengeSteps({ userChallengeId: selectedChallenge, steps: stepCount, duration });
      }
      const statsRes = await api.getTodayStats();
      if (statsRes.data) setStepHistory(statsRes.data);
      Vibration.vibrate(200);
      Alert.alert('Success', `${stepCount} steps logged!`);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to log steps');
    }
  };

  const handleManualLog = () => {
    const numSteps = parseInt(manualSteps);
    if (!numSteps || numSteps <= 0) { Alert.alert('Error', 'Enter valid step count'); return; }
    handleLogSteps(numSteps); setManualSteps('');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[screenContainer(theme), { flex: 1 }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.heading1, { color: theme.textPrimary }]}>Step Tracker</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        <NeumorphicCard style={{ alignItems: 'center', marginBottom: 16 }}>
          <StepCounter steps={steps} goal={user?.dailyGoal || 10000} size={160} />
          {isTracking && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
              <Ionicons name="time-outline" size={20} color={theme.accent} />
              <Text style={[styles.heading2, { color: theme.accent, marginLeft: 8 }]}>{formatTime(duration)}</Text>
            </View>
          )}
          <NeumorphicButton title={isTracking ? 'Stop & Save' : 'Start Tracking'} onPress={toggleTracking} variant={isTracking ? 'danger' : 'success'} size="large" style={{ marginTop: 16, width: 200 }} icon={<Ionicons name={isTracking ? 'stop' : 'play'} size={20} color="#FFFFFF" />} />
        </NeumorphicCard>

        <NeumorphicCard style={{ marginBottom: 16 }}>
          <Text style={[styles.heading3, { color: theme.textPrimary, marginBottom: 12 }]}>Manual Entry</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 }}>
            <TouchableOpacity onPress={() => setManualSteps(Math.max(0, parseInt(manualSteps || '0') - 100).toString())} style={[neumorphicCircle(theme, 44), { backgroundColor: theme.surface }]}>
              <Ionicons name="remove" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={[styles.heading1, { fontSize: 32, color: theme.accent }]}>{manualSteps || '0'}</Text>
              <Text style={[styles.small, { color: theme.textMuted }]}>steps</Text>
            </View>
            <TouchableOpacity onPress={() => setManualSteps((parseInt(manualSteps || '0') + 100).toString())} style={[neumorphicCircle(theme, 44), { backgroundColor: theme.surface }]}>
              <Ionicons name="add" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>
          <NeumorphicButton title="Log Steps" onPress={handleManualLog} variant="primary" size="medium" style={{ marginTop: 16, alignSelf: 'center' }} />
        </NeumorphicCard>

        {myEnrollments.filter(e => e.status === 'ACTIVE').length > 0 && (
          <>
            <Text style={[styles.heading3, { marginTop: 8, marginBottom: 12, color: theme.textPrimary }]}>Apply to Challenge</Text>
            {myEnrollments.filter(e => e.status === 'ACTIVE').map((enrollment) => (
              <TouchableOpacity key={enrollment.id} onPress={() => setSelectedChallenge(selectedChallenge === enrollment.id ? null : enrollment.id)} style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, marginBottom: 8, borderWidth: 2, backgroundColor: theme.surface, borderColor: selectedChallenge === enrollment.id ? theme.accent : 'transparent' }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.body, { fontWeight: '600', color: theme.textPrimary }]}>{enrollment.challenge?.title}</Text>
                  <Text style={[styles.small, { color: theme.textMuted }]}>{enrollment.currentSteps.toLocaleString()} / {enrollment.challenge?.targetSteps?.toLocaleString()} steps</Text>
                </View>
                {selectedChallenge === enrollment.id && <Ionicons name="checkmark-circle" size={24} color={theme.accent} />}
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}
