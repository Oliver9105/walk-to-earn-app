import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../store';
import { api } from '../services/api';
import { textStyles, screenContainer, neumorphicCircle } from '../utils/theme';
import NeumorphicCard from '../components/ui/NeumorphicCard';
import GlassmorphicCard from '../components/ui/GlassmorphicCard';
import StatusBadge from '../components/ui/StatusBadge';
import { RootStackParamList } from '../../App';

export default function WalletScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, user, walletBalance, transactions, setWalletBalance, setTransactions } = useStore();
  const styles = textStyles(theme);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWalletData = useCallback(async () => {
    try {
      const [balanceRes, txRes] = await Promise.all([
        api.getWalletBalance(),
        api.getTransactions({ limit: 10 }),
      ]);
      if (balanceRes.data?.balance !== undefined) setWalletBalance(Number(balanceRes.data.balance));
      if (txRes.data) setTransactions(txRes.data);
    } catch (error) {
      console.error('Wallet fetch error:', error);
    }
  }, []);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWalletData();
    setRefreshing(false);
  };

  const getTransactionIcon = (type: string) => {
    const icons: Record<string, string> = {
      DEPOSIT: 'arrow-down-circle',
      WITHDRAWAL: 'arrow-up-circle',
      ENTRY_FEE: 'trophy',
      GUARANTEE_FEE: 'shield',
      REWARD: 'gift',
      BONUS: 'star',
      REFUND: 'return-up-back',
      PENALTY: 'warning',
    };
    return icons[type] || 'swap-horizontal';
  };

  const getTransactionColor = (type: string) => {
    const colors: Record<string, string> = {
      DEPOSIT: theme.success,
      WITHDRAWAL: theme.error,
      ENTRY_FEE: theme.warning,
      GUARANTEE_FEE: theme.warning,
      REWARD: theme.success,
      BONUS: theme.accent,
      REFUND: theme.info,
      PENALTY: theme.error,
    };
    return colors[type] || theme.textMuted;
  };

  return (
    <View style={[screenContainer(theme), localStyles.container]}>
      <LinearGradient colors={[theme.accent, theme.accentDark]} style={localStyles.headerGradient}>
        <View style={localStyles.header}>
          <View style={localStyles.headerTop}>
            <Text style={[styles.heading1, { color: '#FFFFFF', fontSize: 24 }]}>My Wallet</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={[neumorphicCircle(theme, 44), { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <GlassmorphicCard style={localStyles.balanceCard} colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}>
            <Text style={[styles.caption, { color: 'rgba(255,255,255,0.8)', textAlign: 'center' }]}>Total Balance</Text>
            <Text style={[styles.heading1, { color: '#FFFFFF', fontSize: 36, textAlign: 'center', marginTop: 4 }]}>
              KES {walletBalance.toLocaleString()}
            </Text>
            <Text style={[styles.small, { color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: 4 }]}>
              ≈ ${(walletBalance / 129).toFixed(2)} USD
            </Text>
          </GlassmorphicCard>
          <View style={localStyles.actionRow}>
            <TouchableOpacity onPress={() => navigation.navigate('Deposit')} style={[localStyles.actionBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="add-circle" size={28} color="#FFFFFF" />
              <Text style={[styles.small, { color: '#FFFFFF', fontWeight: '700', marginTop: 6 }]}>Deposit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Withdraw')} style={[localStyles.actionBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="arrow-down-circle" size={28} color="#FFFFFF" />
              <Text style={[styles.small, { color: '#FFFFFF', fontWeight: '700', marginTop: 6 }]}>Withdraw</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('TransactionHistory')} style={[localStyles.actionBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="stats-chart" size={28} color="#FFFFFF" />
              <Text style={[styles.small, { color: '#FFFFFF', fontWeight: '700', marginTop: 6 }]}>Stats</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} contentContainerStyle={localStyles.scrollContent}>
        <View style={localStyles.statsGrid}>
          <NeumorphicCard style={localStyles.statCard} pressed>
            <Ionicons name="trending-up" size={24} color={theme.success} />
            <Text style={[styles.heading3, { fontSize: 16, marginTop: 8, color: theme.textPrimary }]}>KES {user?.totalEarned?.toLocaleString() || 0}</Text>
            <Text style={[styles.small, { color: theme.textMuted }]}>Total Earned</Text>
          </NeumorphicCard>
          <NeumorphicCard style={localStyles.statCard} pressed>
            <Ionicons name="cash-outline" size={24} color={theme.info} />
            <Text style={[styles.heading3, { fontSize: 16, marginTop: 8, color: theme.textPrimary }]}>KES {user?.totalDeposited?.toLocaleString() || 0}</Text>
            <Text style={[styles.small, { color: theme.textMuted }]}>Total Deposited</Text>
          </NeumorphicCard>
          <NeumorphicCard style={localStyles.statCard} pressed>
            <Ionicons name="arrow-up-circle" size={24} color={theme.error} />
            <Text style={[styles.heading3, { fontSize: 16, marginTop: 8, color: theme.textPrimary }]}>KES {user?.totalWithdrawn?.toLocaleString() || 0}</Text>
            <Text style={[styles.small, { color: theme.textMuted }]}>Total Withdrawn</Text>
          </NeumorphicCard>
          <NeumorphicCard style={localStyles.statCard} pressed>
            <Ionicons name="trophy" size={24} color={theme.warning} />
            <Text style={[styles.heading3, { fontSize: 16, marginTop: 8, color: theme.textPrimary }]}>{(user as any)?.stats?.challengesJoined || 0}</Text>
            <Text style={[styles.small, { color: theme.textMuted }]}>Challenges</Text>
          </NeumorphicCard>
        </View>

        <View style={localStyles.sectionHeader}>
          <Text style={[styles.heading3, { color: theme.textPrimary }]}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => navigation.navigate('TransactionHistory')}>
            <Text style={[styles.accent, { fontSize: 14 }]}>View All</Text>
          </TouchableOpacity>
        </View>

        {transactions.length === 0 ? (
          <NeumorphicCard style={localStyles.emptyCard} pressed>
            <Ionicons name="receipt-outline" size={40} color={theme.textMuted} />
            <Text style={[styles.body, { textAlign: 'center', marginTop: 12, color: theme.textSecondary }]}>No transactions yet. Make your first deposit!</Text>
          </NeumorphicCard>
        ) : (
          transactions.map((tx) => (
            <NeumorphicCard key={tx.id} style={localStyles.txCard} pressed>
              <View style={localStyles.txRow}>
                <View style={[localStyles.txIcon, { backgroundColor: getTransactionColor(tx.type) + '15' }]}>
                  <Ionicons name={getTransactionIcon(tx.type) as any} size={22} color={getTransactionColor(tx.type)} />
                </View>
                <View style={localStyles.txInfo}>
                  <Text style={[styles.body, { fontWeight: '700', color: theme.textPrimary }]}>{tx.description || tx.type.replace('_', ' ')}</Text>
                  <Text style={[styles.small, { color: theme.textMuted }]}>{new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                <View style={localStyles.txAmount}>
                  <Text style={[styles.body, { fontWeight: '800', color: ['DEPOSIT', 'REWARD', 'BONUS', 'REFUND'].includes(tx.type) ? theme.success : theme.error }]}>
                    {['DEPOSIT', 'REWARD', 'BONUS', 'REFUND'].includes(tx.type) ? '+' : '-'}KES {Number(tx.amount).toLocaleString()}
                  </Text>
                  <StatusBadge status={tx.status} size="small" />
                </View>
              </View>
            </NeumorphicCard>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { paddingTop: 50, paddingBottom: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  header: { paddingHorizontal: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  balanceCard: { marginTop: 8, marginHorizontal: 0, paddingVertical: 24 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  actionBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  scrollContent: { paddingTop: 20, paddingHorizontal: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 8 },
  statCard: { width: '48%', alignItems: 'center', paddingVertical: 16, marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 12, paddingHorizontal: 4 },
  emptyCard: { alignItems: 'center', paddingVertical: 32, marginBottom: 16 },
  txCard: { marginBottom: 10, paddingVertical: 14, paddingHorizontal: 16 },
  txRow: { flexDirection: 'row', alignItems: 'center' },
  txIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  txInfo: { flex: 1 },
  txAmount: { alignItems: 'flex-end' },
});
