import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { api } from '../services/api';
import { textStyles, screenContainer } from '../utils/theme';
import NeumorphicCard from '../components/ui/NeumorphicCard';
import { RootStackParamList } from '../../App';

export default function LeaderboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, user } = useStore();
  const styles = textStyles(theme);
  const [leaders, setLeaders] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('steps');

  const fetchLeaderboard = async () => {
    try {
      const response = await api.getLeaderboard({ type: filter, limit: 50 });
      if (response.data) setLeaders(response.data);
    } catch (error) {
      console.error('Leaderboard error:', error);
    }
  };

  useEffect(() => { fetchLeaderboard(); }, [filter]);
  const onRefresh = async () => { setRefreshing(true); await fetchLeaderboard(); setRefreshing(false); };

  const filters = [
    { key: 'steps', label: 'Steps', icon: 'footsteps' },
    { key: 'earnings', label: 'Earnings', icon: 'cash' },
    { key: 'streak', label: 'Streak', icon: 'flame' },
    { key: 'level', label: 'Level', icon: 'trophy' },
  ];

  const getRankStyle = (rank: number) => {
    if (rank === 1) return { color: '#FFD700', icon: '🥇' };
    if (rank === 2) return { color: '#C0C0C0', icon: '🥈' };
    if (rank === 3) return { color: '#CD7F32', icon: '🥉' };
    return { color: theme.textMuted, icon: `#${rank}` };
  };

  return (
    <View style={[screenContainer(theme), { flex: 1 }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.heading1, { color: theme.textPrimary }]}>Leaderboard</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}>
        {filters.map((f) => (
          <TouchableOpacity key={f.key} onPress={() => setFilter(f.key)} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, backgroundColor: filter === f.key ? theme.accent : theme.surface }}>
            <Ionicons name={f.icon as any} size={14} color={filter === f.key ? '#FFFFFF' : theme.textSecondary} />
            <Text style={[styles.small, { marginLeft: 6, color: filter === f.key ? '#FFFFFF' : theme.textSecondary, fontWeight: '600' }]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8 }}>
        {leaders.map((leader) => {
          const rankStyle = getRankStyle(leader.rank);
          const isMe = leader.userId === user?.id;
          return (
            <NeumorphicCard key={leader.userId} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, paddingVertical: 12, paddingHorizontal: 16 }} pressed>
              <Text style={[styles.heading3, { fontSize: 16, width: 50, color: rankStyle.color }]}>{rankStyle.icon}</Text>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={[styles.body, { fontWeight: '700', color: theme.textPrimary }]}>{leader.fullName} {isMe && <Text style={{ color: theme.accent }}>(You)</Text>}</Text>
                <Text style={[styles.small, { color: theme.textMuted }]}>Level {leader.level} • {leader.currentStreak} day streak</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.heading3, { fontSize: 16, color: theme.accent }]}>
                  {filter === 'earnings' ? `KES ${leader.totalEarned?.toLocaleString()}` : filter === 'steps' ? leader.totalSteps?.toLocaleString() : filter === 'streak' ? `${leader.currentStreak}d` : `Lv.${leader.level}`}
                </Text>
              </View>
            </NeumorphicCard>
          );
        })}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}
