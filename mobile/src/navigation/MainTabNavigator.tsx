import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { neumorphicTabBar, neumorphicIconButton, textStyles } from '../utils/theme';

// Screens
import HomeScreen from '../screens/HomeScreen';
import ChallengesScreen from '../screens/ChallengesScreen';
import WalletScreen from '../screens/WalletScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  const { theme } = useStore();
  const styles = textStyles(theme);

  const tabs = [
    { name: 'Home', icon: 'home', label: 'Home' },
    { name: 'Challenges', icon: 'trophy', label: 'Challenges' },
    { name: 'Wallet', icon: 'wallet', label: 'Wallet' },
    { name: 'Profile', icon: 'person', label: 'Profile' },
  ];

  return (
    <View style={[localStyles.container, neumorphicTabBar(theme)]}>
      {tabs.map((tab, index) => {
        const isFocused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: state.routes[index].key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(tab.name);
          }
        };

        return (
          <TouchableOpacity
            key={tab.name}
            onPress={onPress}
            style={localStyles.tabButton}
            activeOpacity={0.8}
          >
            <View
              style={[
                neumorphicIconButton(theme, isFocused ? 52 : 44),
                isFocused && {
                  backgroundColor: theme.accent,
                  shadowColor: theme.accentDark,
                },
              ]}
            >
              <Ionicons
                name={isFocused ? `${tab.icon}` as any : `${tab.icon}-outline` as any}
                size={isFocused ? 24 : 22}
                color={isFocused ? '#FFFFFF' : theme.textSecondary}
              />
            </View>
            <Text
              style={[
                localStyles.tabLabel,
                { color: isFocused ? theme.accent : theme.textMuted },
                isFocused && { fontWeight: '700' },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Challenges" component={ChallengesScreen} />
      <Tab.Screen name="Wallet" component={WalletScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
});
