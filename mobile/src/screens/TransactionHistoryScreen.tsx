import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { api } from '../services/api';
import { textStyles, screenContainer } from '../utils/theme';
import NeumorphicCard from '../components/ui/NeumorphicCard';
import StatusBadge from '../components/ui/StatusBadge';
import { RootStackParamList } from '../../App';

export default function TransactionHistoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, transactions, setTransactions } = useStore();
  const styles = textStyles(theme);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('ALL');

  const fetchTransactions = async () => {
    try {
      const params: any = { limit: 50 };
      if (filter !== 'ALL') params.type = filter;
      const response = await api.getTransactions(params);
      if (response.data) setTransactions(response.data);
    } catch (error) {
      console.error('Transaction history error:', error);
    }
  };

  useEffect(() => { fetchTransactions(); }, [filter]);

  const onRefresh = async () => { setRefreshing(true); await fetchTransactions(); setRefreshing(false); };
  const filters = ['ALL', 'DEPOSIT', 'WITHDRAWAL', 'REWARD', 'ENTRY_FEE'];

  return (
    <View style={[screenContainer(theme), { flex: 1 }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.heading1, { color: theme.textPrimary }]}>History</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}>
        {filters.map((f) => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, backgroundColor: filter === f ? theme.accent : theme.surface }}>
            <Text style={[styles.small, { color: filter === f ? '#FFFFFF' : theme.textSecondary, fontWeight: '600' }]}>{f === 'ALL' ? 'All' : f.replace('_', ' ')}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8 }}>
        {transactions.length === 0 ? (
          <NeumorphicCard style={{ alignItems: 'center', paddingVertical: 48, marginHorizontal: 16 }} pressed>
            <Ionicons name="receipt-outline" size={48} color={theme.textMuted} />
            <Text style={[styles.body, { textAlign: 'center', marginTop: 12, color: theme.textSecondary }]}>No transactions found</Text>
          </NeumorphicCard>
        ) : (
          transactions.map((tx) => (
            <NeumorphicCard key={tx.id} style={{ marginBottom: 10, paddingVertical: 14, paddingHorizontal: 16 }} pressed>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14, backgroundColor: (tx.type === 'DEPOSIT' || tx.type === 'REWARD') ? theme.success + '15' : theme.error + '15' }}>
                  <Ionicons name={tx.type === 'DEPOSIT' ? 'arrow-down' : tx.type === 'WITHDRAWAL' ? 'arrow-up' : 'swap-horizontal'} size={20} color={tx.type === 'DEPOSIT' || tx.type === 'REWARD' ? theme.success : theme.error} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.body, { fontWeight: '700', color: theme.textPrimary }]}>{tx.description || tx.type}</Text>
                  <Text style={[styles.small, { color: theme.textMuted }]}>{new Date(tx.createdAt).toLocaleDateString()}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.body, { fontWeight: '800', color: (tx.type === 'DEPOSIT' || tx.type === 'REWARD') ? theme.success : theme.error }]}>
                    {(tx.type === 'DEPOSIT' || tx.type === 'REWARD') ? '+' : '-'}KES {Number(tx.amount).toLocaleString()}
                  </Text>
                  <StatusBadge status={tx.status} size="small" />
                </View>
              </View>
            </NeumorphicCard>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}
