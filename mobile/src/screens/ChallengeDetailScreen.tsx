import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../store';
import { api } from '../services/api';
import { textStyles, screenContainer } from '../utils/theme';
import NeumorphicCard from '../components/ui/NeumorphicCard';
import GlassmorphicCard from '../components/ui/GlassmorphicCard';
import NeumorphicButton from '../components/ui/NeumorphicButton';
import StatusBadge from '../components/ui/StatusBadge';
import { RootStackParamList } from '../../App';

type ChallengeDetailRouteProp = RouteProp<RootStackParamList, 'ChallengeDetail'>;

export default function ChallengeDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<ChallengeDetailRouteProp>();
  const { theme, user, myEnrollments, setMyEnrollments, walletBalance } = useStore();
  const styles = textStyles(theme);
  const [challenge, setChallenge] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    fetchChallenge();
  }, [route.params.challengeId]);

  const fetchChallenge = async () => {
    try {
      const response = await api.getChallenge(route.params.challengeId);
      if (response.data) setChallenge(response.data);
    } catch (error) {
      console.error('Challenge detail error:', error);
    } finally {
      setLoading(false);
    }
  };

  const isEnrolled = myEnrollments.some(e => e.challengeId === route.params.challengeId);
  const myEnrollment = myEnrollments.find(e => e.challengeId === route.params.challengeId);

  const handleEnroll = async (useGuarantee: boolean = false) => {
    const totalFee = Number(challenge.entryFee) + (useGuarantee ? Number(challenge.guaranteeFee) : 0);
    if (walletBalance < totalFee) {
      Alert.alert('Insufficient Balance', `You need KES ${totalFee} to join.`);
      return;
    }
    setEnrolling(true);
    try {
      const response = await api.enrollInChallenge({ challengeId: challenge.id, useGuarantee });
      if (response.data) {
        const enrollmentsRes = await api.getMyEnrollments();
        if (enrollmentsRes.data) setMyEnrollments(enrollmentsRes.data);
        Alert.alert('Success', 'You have successfully joined the challenge!');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to join');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading || !challenge) {
    return (
      <View style={[screenContainer(theme), { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.body}>Loading...</Text>
      </View>
    );
  }

  const milestones = challenge.milestoneRewards || [];
  const progress = myEnrollment ? (myEnrollment.currentSteps / challenge.targetSteps) * 100 : 0;

  return (
    <View style={[screenContainer(theme), { flex: 1 }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[theme.accent, '#A29BFE']} style={{ paddingTop: 50, paddingBottom: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            {challenge.featured && (
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
                <Ionicons name="star" size={12} color={theme.warning} />
                <Text style={[styles.small, { color: theme.warning, fontWeight: '700', marginLeft: 4 }]}>Featured</Text>
              </View>
            )}
          </View>
          <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
            <Text style={[styles.heading1, { color: '#FFFFFF', fontSize: 26 }]}>{challenge.title}</Text>
            <Text style={[styles.body, { color: 'rgba(255,255,255,0.8)', marginTop: 8 }]}>{challenge.description}</Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 20, gap: 10 }}>
            {[
              { label: 'Target Steps', value: challenge.targetSteps.toLocaleString() },
              { label: 'Days', value: challenge.targetDays.toString() },
              { label: 'Entry Fee', value: `KES ${challenge.entryFee}` },
              { label: 'Multiplier', value: `${challenge.baseMultiplier}x` },
            ].map((stat, i) => (
              <GlassmorphicCard key={i} style={{ width: '47%', padding: 14 }} colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}>
                <Text style={[styles.heading2, { color: '#FFFFFF', fontSize: 18 }]}>{stat.value}</Text>
                <Text style={[styles.small, { color: 'rgba(255,255,255,0.7)' }]}>{stat.label}</Text>
              </GlassmorphicCard>
            ))}
          </View>
        </LinearGradient>

        <View style={{ paddingTop: 20, paddingHorizontal: 16 }}>
          {isEnrolled && myEnrollment && (
            <NeumorphicCard style={{ marginBottom: 16 }}>
              <Text style={[styles.heading3, { color: theme.textPrimary, marginBottom: 12 }]}>Your Progress</Text>
              <View style={{ height: 10, borderRadius: 5, backgroundColor: theme.surfaceShadow + '40', overflow: 'hidden' }}>
                <View style={{ height: '100%', borderRadius: 5, width: `${Math.min(100, progress)}%`, backgroundColor: myEnrollment.status === 'COMPLETED' ? theme.success : theme.accent }} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                <Text style={[styles.small, { color: theme.textMuted }]}>{myEnrollment.currentSteps.toLocaleString()} / {challenge.targetSteps.toLocaleString()} steps</Text>
                <Text style={[styles.small, { color: theme.success, fontWeight: '700' }]}>KES {(myEnrollment.earnedAmount + myEnrollment.bonusEarned).toLocaleString()} earned</Text>
              </View>
            </NeumorphicCard>
          )}

          <Text style={[styles.heading3, { marginTop: 8, marginBottom: 12, color: theme.textPrimary }]}>Milestone Rewards</Text>
          <NeumorphicCard style={{ marginBottom: 16 }}>
            {milestones.map((milestone: any, index: number) => {
              const reached = myEnrollment?.milestonesReached?.includes(milestone.percentage);
              return (
                <View key={index} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: index < milestones.length - 1 ? 12 : 0, borderBottomWidth: index < milestones.length - 1 ? 1 : 0, borderBottomColor: theme.surfaceShadow + '20' }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 14, backgroundColor: reached ? theme.success : theme.accent }}>
                    <Text style={[styles.small, { color: '#FFFFFF', fontWeight: '700' }]}>{milestone.percentage}%</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.body, { fontWeight: '600', color: theme.textPrimary }]}>
                      {milestone.percentage === 25 ? 'First Quarter' : milestone.percentage === 50 ? 'Halfway There' : milestone.percentage === 75 ? 'Almost Done' : 'Champion'}
                    </Text>
                    <Text style={[styles.small, { color: theme.textMuted }]}>{Math.round(challenge.targetSteps * milestone.percentage / 100).toLocaleString()} steps</Text>
                  </View>
                  <Text style={[styles.heading3, { fontSize: 16, color: reached ? theme.success : theme.textPrimary }]}>{reached ? '✓ ' : ''}KES {milestone.reward}</Text>
                </View>
              );
            })}
          </NeumorphicCard>

          {challenge.leaderboard && challenge.leaderboard.length > 0 && (
            <>
              <Text style={[styles.heading3, { marginTop: 16, marginBottom: 12, color: theme.textPrimary }]}>Leaderboard</Text>
              {challenge.leaderboard.slice(0, 5).map((entry: any) => (
                <NeumorphicCard key={entry.rank} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingVertical: 12, paddingHorizontal: 16 }} pressed>
                  <Text style={[styles.heading3, { fontSize: 16, width: 30, color: entry.rank === 1 ? theme.warning : entry.rank === 2 ? theme.textSecondary : entry.rank === 3 ? '#CD7F32' : theme.textMuted }]}>#{entry.rank}</Text>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={[styles.body, { fontWeight: '600', color: theme.textPrimary }]}>{entry.fullName}</Text>
                    <Text style={[styles.small, { color: theme.textMuted }]}>{entry.currentSteps.toLocaleString()} steps</Text>
                  </View>
                </NeumorphicCard>
              ))}
            </>
          )}

          {!isEnrolled && challenge.status === 'OPEN' && (
            <View style={{ marginTop: 16, marginBottom: 24 }}>
              <NeumorphicButton title={enrolling ? 'Joining...' : `Join Challenge — KES ${challenge.entryFee}`} onPress={() => handleEnroll(false)} disabled={enrolling} size="large" style={{ marginBottom: 12 }} />
              <NeumorphicButton title={`Join with Guarantee — KES ${Number(challenge.entryFee) + Number(challenge.guaranteeFee)}`} onPress={() => handleEnroll(true)} variant="secondary" disabled={enrolling} size="large" />
            </View>
          )}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>
    </View>
  );
}
