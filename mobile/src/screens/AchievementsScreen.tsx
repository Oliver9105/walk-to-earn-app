import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { api } from '../services/api';
import { textStyles, screenContainer } from '../utils/theme';
import NeumorphicCard from '../components/ui/NeumorphicCard';
import ProgressRing from '../components/ui/ProgressRing';
import { RootStackParamList } from '../../App';

export default function AchievementsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, user, achievements, setAchievements } = useStore();
  const styles = textStyles(theme);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAchievements = async () => {
    try {
      const response = await api.getProfile();
      if (response.data?.achievements) setAchievements(response.data.achievements);
    } catch (error) {
      console.error('Achievements error:', error);
    }
  };

  useEffect(() => { fetchAchievements(); }, []);
  const onRefresh = async () => { setRefreshing(true); await fetchAchievements(); setRefreshing(false); };

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      COMMON: '#B2BEC3', UNCOMMON: '#00B894', RARE: '#3498DB',
      EPIC: '#9B59B6', LEGENDARY: '#F39C12', MYTHIC: '#E91E63',
    };
    return colors[rarity] || theme.textMuted;
  };

  const getIcon = (iconName: string) => {
    const map: Record<string, string> = {
      footprints: '👟', trophy: '🏆', medal: '🎖️', flame: '🔥', crown: '👑',
      star: '⭐', award: '🏅', 'dollar-sign': '💰', zap: '⚡', shield: '🛡️',
    };
    return map[iconName] || '🎯';
  };

  const completedCount = achievements.filter(a => a.completed).length;

  return (
    <View style={[screenContainer(theme), { flex: 1 }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.heading1, { color: theme.textPrimary }]}>Achievements</Text>
        <View style={{ width: 40 }} />
      </View>
      <NeumorphicCard style={{ marginHorizontal: 16, marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <ProgressRing progress={achievements.length > 0 ? (completedCount / achievements.length) * 100 : 0} size={80} strokeWidth={8} />
          <View style={{ marginLeft: 20 }}>
            <Text style={[styles.heading2, { color: theme.textPrimary }]}>{completedCount} / {achievements.length}</Text>
            <Text style={[styles.body, { color: theme.textSecondary }]}>Achievements Unlocked</Text>
          </View>
        </View>
      </NeumorphicCard>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8 }}>
        {achievements.map((achievement) => (
          <NeumorphicCard key={achievement.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, paddingVertical: 14, paddingHorizontal: 16 }} pressed>
            <View style={{ width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 14, backgroundColor: achievement.badgeColor + '20' }}>
              <Text style={{ fontSize: 28 }}>{getIcon(achievement.icon)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[styles.body, { fontWeight: '700', color: theme.textPrimary }]}>{achievement.name}</Text>
                <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1, backgroundColor: getRarityColor(achievement.rarity) + '20', borderColor: getRarityColor(achievement.rarity) + '40' }}>
                  <Text style={[styles.small, { color: getRarityColor(achievement.rarity), fontWeight: '700' }]}>{achievement.rarity}</Text>
                </View>
              </View>
              <Text style={[styles.small, { color: theme.textSecondary, marginTop: 2 }]}>{achievement.description}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: theme.surfaceShadow + '40', overflow: 'hidden' }}>
                  <View style={{ height: '100%', borderRadius: 3, width: `${Math.min(100, (achievement.progress / achievement.requirementValue) * 100)}%`, backgroundColor: achievement.completed ? theme.success : theme.accent }} />
                </View>
                <Text style={[styles.small, { color: theme.textMuted, marginLeft: 8 }]}>{achievement.progress}/{achievement.requirementValue}</Text>
              </View>
              {achievement.completed && <Text style={[styles.small, { color: theme.success, fontWeight: '700', marginTop: 4 }]}>✓ Completed! +{achievement.xpReward} XP</Text>}
            </View>
          </NeumorphicCard>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}
