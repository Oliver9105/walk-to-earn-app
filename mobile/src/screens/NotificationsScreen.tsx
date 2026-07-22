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

export default function NotificationsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, notifications, setNotifications, setUnreadCount } = useStore();
  const styles = textStyles(theme);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await api.getNotifications({ limit: 50 });
      if (response.data) setNotifications(response.data);
      if (response.unreadCount !== undefined) setUnreadCount(response.unreadCount);
    } catch (error) {
      console.error('Notifications error:', error);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);
  const onRefresh = async () => { setRefreshing(true); await fetchNotifications(); setRefreshing(false); };

  const markRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(Math.max(0, notifications.filter(n => !n.read).length - 1));
    } catch (error) { console.error('Mark read error:', error); }
  };

  const markAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) { console.error('Mark all read error:', error); }
  };

  const getIcon = (type: string) => {
    const icons: Record<string, string> = {
      TRANSACTION: 'cash-outline', CHALLENGE: 'trophy-outline', ACHIEVEMENT: 'medal-outline',
      SYSTEM: 'information-circle-outline', REMINDER: 'time-outline', REWARD: 'gift-outline',
    };
    return icons[type] || 'notifications-outline';
  };

  const getColor = (type: string) => {
    const colors: Record<string, string> = {
      TRANSACTION: theme.info, CHALLENGE: theme.accent, ACHIEVEMENT: theme.warning,
      SYSTEM: theme.textMuted, REMINDER: theme.error, REWARD: theme.success,
    };
    return colors[type] || theme.textMuted;
  };

  return (
    <View style={[screenContainer(theme), { flex: 1 }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.heading1, { color: theme.textPrimary }]}>Notifications</Text>
        <TouchableOpacity onPress={markAllRead}>
          <Text style={[styles.small, { color: theme.accent, fontWeight: '700' }]}>Mark All</Text>
        </TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8 }}>
        {notifications.length === 0 ? (
          <NeumorphicCard style={{ alignItems: 'center', paddingVertical: 48, marginHorizontal: 16 }} pressed>
            <Ionicons name="notifications-off-outline" size={48} color={theme.textMuted} />
            <Text style={[styles.body, { textAlign: 'center', marginTop: 12, color: theme.textSecondary }]}>No notifications yet</Text>
          </NeumorphicCard>
        ) : (
          notifications.map((notification) => (
            <TouchableOpacity key={notification.id} onPress={() => !notification.read && markRead(notification.id)}>
              <NeumorphicCard style={{ marginBottom: 10, paddingVertical: 14, paddingHorizontal: 16, opacity: notification.read ? 0.7 : 1 }} pressed>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14, backgroundColor: getColor(notification.type) + '15' }}>
                    <Ionicons name={getIcon(notification.type) as any} size={22} color={getColor(notification.type)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.body, { fontWeight: '700', color: theme.textPrimary }]}>{notification.title}</Text>
                    <Text style={[styles.small, { color: theme.textSecondary, marginTop: 2 }]} numberOfLines={2}>{notification.body}</Text>
                    <Text style={[styles.small, { color: theme.textMuted, marginTop: 4 }]}>{new Date(notification.createdAt).toLocaleDateString()}</Text>
                  </View>
                  {!notification.read && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: theme.accent, marginLeft: 8 }} />}
                </View>
              </NeumorphicCard>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}
