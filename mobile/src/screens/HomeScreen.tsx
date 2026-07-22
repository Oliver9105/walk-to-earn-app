import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../store';
import { api } from '../services/api';
import { textStyles, screenContainer, neumorphicShadows, neumorphicCircle } from '../utils/theme';
import NeumorphicCard from '../components/ui/NeumorphicCard';
import GlassmorphicCard from '../components/ui/GlassmorphicCard';
import NeumorphicButton from '../components/ui/NeumorphicButton';
import StepCounter from '../components/ui/StepCounter';
import StatusBadge from '../components/ui/StatusBadge';
import { RootStackParamList } from '../../App';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, user, setUser, setStepHistory, stepHistory, setMyEnrollments, myEnrollments, setUnreadCount } = useStore();
  const styles = textStyles(theme);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [userRes, stepsRes, enrollmentsRes, notifRes] = await Promise.all([
        api.getMe(),
        api.getTodayStats(),
        api.getMyEnrollments('ACTIVE'),
        api.getNotifications({ unread: true, limit: 1 }),
      ]);

      if (userRes.data) setUser(userRes.data);
      if (stepsRes.data) setStepHistory(stepsRes.data);
      if (enrollmentsRes.data) setMyEnrollments(enrollmentsRes.data);
      if (notifRes.unreadCount !== undefined) setUnreadCount(notifRes.unreadCount);
    } catch (error) {
      console.error('Home data fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const todayStats = stepHistory?.today;
  const weeklySteps = stepHistory?.weeklySteps || [];

  return (
    <View style={[screenContainer(theme), localStyles.container]}>
      <LinearGradient
        colors={[theme.accent, theme.accentDark]}
        style={localStyles.headerGradient}
      >
        <View style={localStyles.header}>
          <View style={localStyles.headerTop}>
            <View>
              <Text style={[styles.caption, { color: 'rgba(255,255,255,0.7)' }]}>
                Welcome back,
              </Text>
              <Text style={[styles.heading2, { color: '#FFFFFF' }]}>
                {user?.fullName?.split(' ')[0] || 'Walker'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Notifications')}
              style={[neumorphicCircle(theme, 44), { backgroundColor: 'rgba(255,255,255,0.2)' }]}
            >
              <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <GlassmorphicCard style={localStyles.walletCard} colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}>
            <View style={localStyles.walletContent}>
              <View>
                <Text style={[styles.caption, { color: 'rgba(255,255,255,0.8)' }]}>
                  Wallet Balance
                </Text>
                <Text style={[styles.heading1, { color: '#FFFFFF', fontSize: 28 }]}>
                  KES {user?.walletBalance?.toLocaleString() || '0'}
                </Text>
              </View>
              <View style={localStyles.walletActions}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Deposit')}
                  style={[localStyles.walletActionBtn, { backgroundColor: 'rgba(255,255,255,0.25)' }]}
                >
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Withdraw')}
                  style={[localStyles.walletActionBtn, { backgroundColor: 'rgba(255,255,255,0.25)' }]}
                >
                  <Ionicons name="arrow-down" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </GlassmorphicCard>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={localStyles.scrollContent}
      >
        <NeumorphicCard style={localStyles.stepCard}>
          <View style={localStyles.stepHeader}>
            <Text style={[styles.heading3, { color: theme.textPrimary }]}>Today's Progress</Text>
            <TouchableOpacity onPress={() => navigation.navigate('StepTracker')}>
              <Ionicons name="footsteps-outline" size={24} color={theme.accent} />
            </TouchableOpacity>
          </View>
          <StepCounter
            steps={todayStats?.steps || 0}
            goal={todayStats?.goalProgress ? Math.round((todayStats.steps / (todayStats.goalProgress / 100)) || 10000) : 10000}
            size={180}
          />
          <View style={localStyles.statsRow}>
            <View style={localStyles.statItem}>
              <Ionicons name="flame-outline" size={20} color={theme.warning} />
              <Text style={[styles.body, { fontWeight: '700', color: theme.textPrimary }]}>
                {todayStats?.calories?.toFixed(0) || 0}
              </Text>
              <Text style={[styles.small, { color: theme.textMuted }]}>kcal</Text>
            </View>
            <View style={localStyles.statDivider} />
            <View style={localStyles.statItem}>
              <Ionicons name="location-outline" size={20} color={theme.info} />
              <Text style={[styles.body, { fontWeight: '700', color: theme.textPrimary }]}>
                {(todayStats?.distance ? (todayStats.distance / 1000).toFixed(2) : 0)}
              </Text>
              <Text style={[styles.small, { color: theme.textMuted }]}>km</Text>
            </View>
            <View style={localStyles.statDivider} />
            <View style={localStyles.statItem}>
              <Ionicons name="time-outline" size={20} color={theme.success} />
              <Text style={[styles.body, { fontWeight: '700', color: theme.textPrimary }]}>
                {todayStats?.duration ? Math.floor(todayStats.duration / 60) : 0}
              </Text>
              <Text style={[styles.small, { color: theme.textMuted }]}>min</Text>
            </View>
          </View>
        </NeumorphicCard>

        <NeumorphicCard style={localStyles.weeklyCard}>
          <Text style={[styles.heading3, { marginBottom: 16, color: theme.textPrimary }]}>
            Weekly Activity
          </Text>
          <View style={localStyles.chartContainer}>
            {weeklySteps.map((day, index) => {
              const maxSteps = Math.max(...weeklySteps.map(d => d.steps), 10000);
              const height = maxSteps > 0 ? (day.steps / maxSteps) * 100 : 0;
              const isToday = index === weeklySteps.length - 1;
              return (
                <View key={day.date} style={localStyles.barContainer}>
                  <View style={localStyles.barWrapper}>
                    <View
                      style={[
                        localStyles.bar,
                        {
                          height: `${Math.max(height, 5)}%`,
                          backgroundColor: isToday ? theme.accent : theme.accent + '60',
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.small, { fontSize: 10, marginTop: 4, color: theme.textMuted }]}>
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'narrow' })}
                  </Text>
                </View>
              );
            })}
          </View>
        </NeumorphicCard>

        <View style={localStyles.sectionHeader}>
          <Text style={[styles.heading3, { color: theme.textPrimary }]}>Active Challenges</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'Challenges' } as any)}>
            <Text style={[styles.accent, { fontSize: 14 }]}>See All</Text>
          </TouchableOpacity>
        </View>

        {myEnrollments.length === 0 ? (
          <NeumorphicCard style={localStyles.emptyCard} pressed>
            <Ionicons name="trophy-outline" size={40} color={theme.textMuted} />
            <Text style={[styles.body, { textAlign: 'center', marginTop: 12, color: theme.textSecondary }]}>
              No active challenges. Join one to start earning!
            </Text>
            <NeumorphicButton
              title="Browse Challenges"
              onPress={() => navigation.navigate('Main', { screen: 'Challenges' } as any)}
              variant="primary"
              size="small"
              style={{ marginTop: 16 }}
            />
          </NeumorphicCard>
        ) : (
          myEnrollments.slice(0, 2).map((enrollment) => (
            <NeumorphicCard
              key={enrollment.id}
              style={localStyles.challengeCard}
              onPress={() => navigation.navigate('ChallengeDetail', { challengeId: enrollment.challengeId })}
            >
              <View style={localStyles.challengeHeader}>
                <View style={localStyles.challengeInfo}>
                  <Text style={[styles.heading3, { fontSize: 16, color: theme.textPrimary }]}>
                    {enrollment.challenge?.title}
                  </Text>
                  <StatusBadge status={enrollment.status} size="small" />
                </View>
                <Text style={[styles.accent, { fontSize: 14 }]}>
                  Day {enrollment.currentDay}/{enrollment.challenge?.targetDays}
                </Text>
              </View>

              <View style={localStyles.progressContainer}>
                <View style={[localStyles.progressBar, { backgroundColor: theme.surfaceShadow + '40' }]}>
                  <View
                    style={[
                      localStyles.progressFill,
                      {
                        width: `${Math.min(100, (enrollment.currentSteps / (enrollment.challenge?.targetSteps || 1)) * 100)}%`,
                        backgroundColor: theme.accent,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.small, { color: theme.textMuted, marginTop: 4 }]}>
                  {enrollment.currentSteps.toLocaleString()} / {enrollment.challenge?.targetSteps?.toLocaleString()} steps
                </Text>
              </View>

              <View style={localStyles.challengeFooter}>
                <View style={localStyles.earnedBadge}>
                  <Ionicons name="cash-outline" size={14} color={theme.success} />
                  <Text style={[styles.small, { color: theme.success, fontWeight: '700', marginLeft: 4 }]}>
                    KES {(enrollment.earnedAmount + enrollment.bonusEarned).toLocaleString()}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => navigation.navigate('StepTracker')}
                  style={[localStyles.logBtn, { backgroundColor: theme.accent + '20' }]}
                >
                  <Text style={[styles.small, { color: theme.accent, fontWeight: '700' }]}>
                    Log Steps
                  </Text>
                </TouchableOpacity>
              </View>
            </NeumorphicCard>
          ))
        )}

        <Text style={[styles.heading3, { marginTop: 8, marginBottom: 12, color: theme.textPrimary }]}>
          Quick Actions
        </Text>
        <View style={localStyles.actionsGrid}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Leaderboard')}
            style={[localStyles.actionItem, neumorphicShadows(theme, 'soft'), { backgroundColor: theme.surface, borderRadius: 16 }]}
          >
            <Ionicons name="trophy-outline" size={28} color={theme.warning} />
            <Text style={[styles.small, { marginTop: 8, fontWeight: '600', color: theme.textPrimary }]}>Leaderboard</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Achievements')}
            style={[localStyles.actionItem, neumorphicShadows(theme, 'soft'), { backgroundColor: theme.surface, borderRadius: 16 }]}
          >
            <Ionicons name="medal-outline" size={28} color={theme.accent} />
            <Text style={[styles.small, { marginTop: 8, fontWeight: '600', color: theme.textPrimary }]}>Achievements</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('TransactionHistory')}
            style={[localStyles.actionItem, neumorphicShadows(theme, 'soft'), { backgroundColor: theme.surface, borderRadius: 16 }]}
          >
            <Ionicons name="receipt-outline" size={28} color={theme.info} />
            <Text style={[styles.small, { marginTop: 8, fontWeight: '600', color: theme.textPrimary }]}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('ProfileSettings')}
            style={[localStyles.actionItem, neumorphicShadows(theme, 'soft'), { backgroundColor: theme.surface, borderRadius: 16 }]}
          >
            <Ionicons name="settings-outline" size={28} color={theme.textSecondary} />
            <Text style={[styles.small, { marginTop: 8, fontWeight: '600', color: theme.textPrimary }]}>Settings</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { paddingTop: 50, paddingBottom: 24, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  header: { paddingHorizontal: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  walletCard: { marginTop: 8, marginHorizontal: 0 },
  walletContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  walletActions: { flexDirection: 'row', gap: 8 },
  walletActionBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingTop: 20, paddingHorizontal: 16 },
  stepCard: { alignItems: 'center', marginBottom: 16 },
  stepHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 8 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', width: '100%', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  statItem: { alignItems: 'center', flex: 1 },
  statDivider: { width: 1, height: 40, backgroundColor: 'rgba(0,0,0,0.08)' },
  weeklyCard: { marginBottom: 16 },
  chartContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120, paddingTop: 10 },
  barContainer: { flex: 1, alignItems: 'center' },
  barWrapper: { width: '60%', height: 100, justifyContent: 'flex-end', borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.03)', overflow: 'hidden' },
  bar: { width: '100%', borderRadius: 8, minHeight: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 12, paddingHorizontal: 4 },
  emptyCard: { alignItems: 'center', paddingVertical: 32, marginBottom: 16 },
  challengeCard: { marginBottom: 12 },
  challengeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  challengeInfo: { flex: 1 },
  progressContainer: { marginBottom: 12 },
  progressBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  challengeFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  earnedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,184,148,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  logBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 },
  actionItem: { width: (width - 56) / 2, alignItems: 'center', paddingVertical: 20, marginBottom: 12 },
});
