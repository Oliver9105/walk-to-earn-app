import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
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

export default function DepositScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, user } = useStore();
  const styles = textStyles(theme);
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDeposit = async () => {
    const numAmount = parseInt(amount);
    if (!phoneNumber || !amount || isNaN(numAmount) || numAmount < 10) {
      Alert.alert('Error', 'Please enter a valid phone number and amount (min KES 10)');
      return;
    }
    setLoading(true);
    try {
      const response = await api.deposit({ phoneNumber, amount: numAmount });
      if (response.data) {
        Alert.alert('STK Push Sent', 'Check your phone to complete the M-Pesa payment.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to initiate deposit');
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [100, 500, 1000, 2000, 5000];

  return (
    <View style={[screenContainer(theme), { flex: 1 }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.heading1, { color: theme.textPrimary }]}>Deposit</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <NeumorphicCard style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, padding: 16 }}>
          <Ionicons name="information-circle-outline" size={24} color={theme.accent} />
          <Text style={[styles.body, { marginLeft: 12, flex: 1, color: theme.textSecondary }]}>Enter your M-Pesa number and amount. You will receive an STK push to complete payment.</Text>
        </NeumorphicCard>
        <NeumorphicInput label="M-Pesa Phone Number" placeholder="+254 7XX XXX XXX" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" icon={<Ionicons name="call-outline" size={20} color={theme.textMuted} />} />
        <NeumorphicInput label="Amount (KES)" placeholder="Enter amount" value={amount} onChangeText={setAmount} keyboardType="numeric" icon={<Ionicons name="cash-outline" size={20} color={theme.textMuted} />} />
        <Text style={[styles.caption, { marginBottom: 12, marginLeft: 4, color: theme.textMuted }]}>Quick Select</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {quickAmounts.map((amt) => (
            <TouchableOpacity key={amt} onPress={() => setAmount(amt.toString())} style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: amount === amt.toString() ? theme.accent : theme.surface, borderWidth: 1, borderColor: amount === amt.toString() ? theme.accent : theme.surfaceShadow + '30' }}>
              <Text style={[styles.small, { fontWeight: '700', color: amount === amt.toString() ? '#FFFFFF' : theme.textPrimary }]}>KES {amt}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <NeumorphicButton title={loading ? 'Processing...' : 'Deposit via M-Pesa'} onPress={handleDeposit} disabled={loading} size="large" style={{ marginTop: 24 }} icon={loading ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Ionicons name="phone-portrait-outline" size={20} color="#FFFFFF" />} />
      </ScrollView>
    </View>
  );
}
