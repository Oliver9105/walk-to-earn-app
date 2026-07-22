import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { api } from '../services/api';
import { textStyles, screenContainer, neumorphicShadows } from '../utils/theme';
import NeumorphicCard from '../components/ui/NeumorphicCard';
import GlassmorphicCard from '../components/ui/GlassmorphicCard';
import StatusBadge from '../components/ui/StatusBadge';
import { RootStackParamList } from '../../App';

const { width } = Dimensions.get('window');

const categories = ['All', 'WALKING', 'RUNNING', 'HIKING', 'MARATHON', 'SPRINT'];
const difficulties = ['All', 'EASY', 'MEDIUM', 'HARD', 'EXPERT', 'LEGENDARY'];

export default function ChallengesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, challenges, setChallenges, myEnrollments } = useStore();
  const styles = textStyles(theme);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [activeTab, setActiveTab] = useState<'discover' | 'my'>('discover');

  const fetchChallenges = useCallback(async () => {
    try {
      const params: any = { status: 'OPEN', page: 1, limit: 50 };
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (selectedDifficulty !== 'All') params.difficulty = selectedDifficulty;

      const response = await api.getChallenges(params);
      if (response.data) setChallenges(response.data);
    } catch (error) {
      console.error('Fetch challenges error:', error);
    }
  }, [selectedCategory, selectedDifficulty]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchChallenges();
    setRefreshing(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      EASY: theme.success,
      MEDIUM: theme.warning,
      HARD: theme.error,
      EXPERT: theme.error,
      LEGENDARY: theme.accent,
    };
    return colors[difficulty] || theme.textMuted;
  };

  const renderChallengeCard = (challenge: typeof challenges[0]) => (
    <NeumorphicCard
      key={challenge.id}
      style={localStyles.challengeCard}
      onPress={() => navigation.navigate('ChallengeDetail', { challengeId: challenge.id })}
    >
      <View style={localStyles.challengeHeader}>
        <View style={localStyles.challengeTitleSection}>
          <Text style={[styles.heading3, { fontSize: 17, color: theme.textPrimary }]}>
            {challenge.title}
          </Text>
          <View style={localStyles.badges}>
            <StatusBadge status={challenge.difficulty} size="small" />
            <StatusBadge status={challenge.category} size="small" />
          </View>
        </View>
        {challenge.featured && (
          <View style={[localStyles.featuredBadge, { backgroundColor: theme.warning + '30' }]}>
            <Ionicons name="star" size={12} color={theme.warning} />
            <Text style={[styles.small, { color: theme.warning, fontWeight: '700', marginLeft: 4 }]}>Featured</Text>
          </View>
        )}
      </View>

      <Text style={[styles.body, { fontSize: 14, color: theme.textSecondary, marginBottom: 12 }]} numberOfLines={2}>
        {challenge.description}
      </Text>

      <View style={localStyles.challengeStats}>
        <View style={localStyles.stat}>
          <Ionicons name="footsteps-outline" size={16} color={theme.accent} />
          <Text style={[styles.small, { color: theme.textPrimary, fontWeight: '600', marginLeft: 4 }]}>
            {challenge.targetSteps.toLocaleString()}
          </Text>
        </View>
        <View style={localStyles.stat}>
          <Ionicons name="calendar-outline" size={16} color={theme.info} />
          <Text style={[styles.small, { color: theme.textPrimary, fontWeight: '600', marginLeft: 4 }]}>
            {challenge.targetDays} days
          </Text>
        </View>
        <View style={localStyles.stat}>
          <Ionicons name="people-outline" size={16} color={theme.textMuted} />
          <Text style={[styles.small, { color: theme.textPrimary, fontWeight: '600', marginLeft: 4 }]}>
            {challenge.participantCount || 0}/{challenge.maxParticipants}
          </Text>
        </View>
      </View>

      <View style={[localStyles.footer, { borderTopColor: theme.surfaceShadow + '30' }]}>
        <View>
          <Text style={[styles.small, { color: theme.textMuted }]}>Entry Fee</Text>
          <Text style={[styles.heading3, { fontSize: 16, color: theme.textPrimary }]}>
            KES {challenge.entryFee}
          </Text>
        </View>
        <View style={localStyles.rewardSection}>
          <Text style={[styles.small, { color: theme.textMuted }]}>Max Reward</Text>
          <Text style={[styles.heading3, { fontSize: 16, color: theme.success }]}>
            KES {Math.round(challenge.entryFee * challenge.baseMultiplier + challenge.entryFee * challenge.bonusMultiplier)}
          </Text>
        </View>
        <TouchableOpacity
          style={[localStyles.joinBtn, { backgroundColor: theme.accent }]}
          onPress={() => navigation.navigate('ChallengeDetail', { challengeId: challenge.id })}
        >
          <Text style={[styles.button, { color: '#FFFFFF', fontSize: 14 }]}>Join</Text>
        </TouchableOpacity>
      </View>
    </NeumorphicCard>
  );

  return (
    <View style={[screenContainer(theme), localStyles.container]}>
      {/* Header */}
      <View style={localStyles.header}>
        <Text style={[styles.heading1, { color: theme.textPrimary }]}>Challenges</Text>
        <View style={localStyles.tabSwitcher}>
          <TouchableOpacity
            onPress={() => setActiveTab('discover')}
            style={[
              localStyles.tabBtn,
              activeTab === 'discover' && { backgroundColor: theme.accent },
            ]}
          >
            <Text style={[styles.small, { color: activeTab === 'discover' ? '#FFFFFF' : theme.textSecondary, fontWeight: '700' }]}>
              Discover
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('my')}
            style={[
              localStyles.tabBtn,
              activeTab === 'my' && { backgroundColor: theme.accent },
            ]}
          >
            <Text style={[styles.small, { color: activeTab === 'my' ? '#FFFFFF' : theme.textSecondary, fontWeight: '700' }]}>
              My Challenges
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'discover' && (
        <>
          {/* Category Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={localStyles.filterContainer}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[
                  localStyles.filterChip,
                  selectedCategory === cat && { backgroundColor: theme.accent },
                  neumorphicShadows(theme, 'soft'),
                ]}
              >
                <Text style={[
                  styles.small,
                  { color: selectedCategory === cat ? '#FFFFFF' : theme.textSecondary, fontWeight: '600' }
                ]}>
                  {cat === 'All' ? 'All' : cat.charAt(0) + cat.slice(1).toLowerCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Difficulty Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[localStyles.filterContainer, { paddingTop: 0 }]}
          >
            {difficulties.map((diff) => (
              <TouchableOpacity
                key={diff}
                onPress={() => setSelectedDifficulty(diff)}
                style={[
                  localStyles.filterChip,
                  selectedDifficulty === diff && { backgroundColor: getDifficultyColor(diff) },
                  neumorphicShadows(theme, 'soft'),
                ]}
              >
                <Text style={[
                  styles.small,
                  { color: selectedDifficulty === diff ? '#FFFFFF' : theme.textSecondary, fontWeight: '600' }
                ]}>
                  {diff === 'All' ? 'All Levels' : diff}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={localStyles.scrollContent}
      >
        {activeTab === 'discover' ? (
          challenges.length === 0 ? (
            <NeumorphicCard style={localStyles.emptyCard} pressed>
              <Ionicons name="search-outline" size={48} color={theme.textMuted} />
              <Text style={[styles.body, { textAlign: 'center', marginTop: 12, color: theme.textSecondary }]}>
                No challenges found. Try different filters.
              </Text>
            </NeumorphicCard>
          ) : (
            challenges.map(renderChallengeCard)
          )
        ) : (
          myEnrollments.length === 0 ? (
            <NeumorphicCard style={localStyles.emptyCard} pressed>
              <Ionicons name="trophy-outline" size={48} color={theme.textMuted} />
              <Text style={[styles.body, { textAlign: 'center', marginTop: 12, color: theme.textSecondary }]}>
                You haven't joined any challenges yet.
              </Text>
            </NeumorphicCard>
          ) : (
            myEnrollments.map((enrollment) => (
              <NeumorphicCard
                key={enrollment.id}
                style={localStyles.challengeCard}
                onPress={() => navigation.navigate('ChallengeDetail', { challengeId: enrollment.challengeId })}
              >
                <View style={localStyles.challengeHeader}>
                  <Text style={[styles.heading3, { fontSize: 17, color: theme.textPrimary }]}>
                    {enrollment.challenge?.title}
                  </Text>
                  <StatusBadge status={enrollment.status} size="small" />
                </View>
                <View style={localStyles.progressContainer}>
                  <View style={[localStyles.progressBar, { backgroundColor: theme.surfaceShadow + '40' }]}>
                    <View
                      style={[
                        localStyles.progressFill,
                        {
                          width: `${Math.min(100, (enrollment.currentSteps / (enrollment.challenge?.targetSteps || 1)) * 100)}%`,
                          backgroundColor: enrollment.status === 'COMPLETED' ? theme.success : theme.accent,
                        },
                      ]}
                    />
                  </View>
                  <View style={localStyles.progressInfo}>
                    <Text style={[styles.small, { color: theme.textMuted }]}>
                      {enrollment.currentSteps.toLocaleString()} / {enrollment.challenge?.targetSteps?.toLocaleString()} steps
                    </Text>
                    <Text style={[styles.small, { color: theme.success, fontWeight: '700' }]}>
                      KES {(enrollment.earnedAmount + enrollment.bonusEarned).toLocaleString()} earned
                    </Text>
                  </View>
                </View>
              </NeumorphicCard>
            ))
          )
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16 },
  tabSwitcher: { flexDirection: 'row', marginTop: 16, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 12, padding: 4 },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
  filterContainer: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  scrollContent: { paddingTop: 8 },
  challengeCard: { marginHorizontal: 16, marginBottom: 12 },
  challengeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  challengeTitleSection: { flex: 1, marginRight: 8 },
  badges: { flexDirection: 'row', gap: 6, marginTop: 6 },
  featuredBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  challengeStats: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  stat: { flexDirection: 'row', alignItems: 'center' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1 },
  rewardSection: { alignItems: 'flex-end', flex: 1, marginRight: 12 },
  joinBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  emptyCard: { alignItems: 'center', paddingVertical: 48, marginHorizontal: 16 },
  progressContainer: { marginTop: 8 },
  progressBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressInfo: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
});
