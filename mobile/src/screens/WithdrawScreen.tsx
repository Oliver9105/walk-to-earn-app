import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
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

export default function WithdrawScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, user, walletBalance, setWalletBalance } = useStore();
  const styles = textStyles(theme);
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleWithdraw = async () => {
    const numAmount = parseInt(amount);
    if (!phoneNumber || !amount || isNaN(numAmount) || numAmount < 50) {
      Alert.alert('Error', 'Please enter a valid phone number and amount (min KES 50)');
      return;
    }
    if (numAmount > walletBalance) {
      Alert.alert('Error', `Insufficient balance. Available: KES ${walletBalance}`);
      return;
    }
    setLoading(true);
    try {
      const response = await api.withdraw({ phoneNumber, amount: numAmount });
      if (response.data) {
        setWalletBalance(walletBalance - numAmount);
        Alert.alert('Success', 'Withdrawal request submitted. You will receive M-Pesa confirmation shortly.');
        navigation.goBack();
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to process withdrawal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[screenContainer(theme), { flex: 1 }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.heading1, { color: theme.textPrimary }]}>Withdraw</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <NeumorphicCard style={{ alignItems: 'center', paddingVertical: 24, marginBottom: 20 }}>
          <Text style={[styles.caption, { color: theme.textMuted }]}>Available Balance</Text>
          <Text style={[styles.heading1, { fontSize: 32, color: theme.textPrimary, marginTop: 4 }]}>KES {walletBalance.toLocaleString()}</Text>
        </NeumorphicCard>
        <NeumorphicInput label="M-Pesa Phone Number" placeholder="+254 7XX XXX XXX" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" icon={<Ionicons name="call-outline" size={20} color={theme.textMuted} />} />
        <NeumorphicInput label="Amount (KES)" placeholder="Min KES 50" value={amount} onChangeText={setAmount} keyboardType="numeric" icon={<Ionicons name="cash-outline" size={20} color={theme.textMuted} />} />
        <NeumorphicButton title={loading ? 'Processing...' : 'Withdraw to M-Pesa'} onPress={handleWithdraw} disabled={loading} variant="primary" size="large" style={{ marginTop: 24 }} />
      </ScrollView>
    </View>
  );
}
