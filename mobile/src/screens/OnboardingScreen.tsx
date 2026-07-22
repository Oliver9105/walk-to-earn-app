import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStore } from '../store';
import { textStyles, screenContainer } from '../utils/theme';
import NeumorphicButton from '../components/ui/NeumorphicButton';
import { RootStackParamList } from '../../App';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    icon: '👟',
    title: 'Walk & Earn',
    description: 'Turn your daily steps into real money. Every step counts towards your earnings.',
  },
  {
    id: '2',
    icon: '🏆',
    title: 'Join Challenges',
    description: 'Compete in exciting walking challenges. Stake a fee, hit your goals, and win big rewards.',
  },
  {
    id: '3',
    icon: '💰',
    title: 'Instant Payouts',
    description: 'Withdraw your earnings instantly via M-Pesa. Real money for real steps.',
  },
  {
    id: '4',
    icon: '🔒',
    title: 'Secure & Trusted',
    description: 'Your data and funds are protected with bank-level security and M-Pesa integration.',
  },
];

export default function OnboardingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useStore();
  const styles = textStyles(theme);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  const renderSlide = ({ item }: { item: typeof slides[0] }) => (
    <View style={[localStyles.slide, { width }]}>
      <View style={[localStyles.iconContainer, { backgroundColor: theme.accent + '20' }]}>
        <Text style={localStyles.icon}>{item.icon}</Text>
      </View>
      <Text style={[styles.heading2, localStyles.title]}>{item.title}</Text>
      <Text style={[styles.body, localStyles.description, { textAlign: 'center' }]}>
        {item.description}
      </Text>
    </View>
  );

  const renderDots = () => (
    <View style={localStyles.dotsContainer}>
      {slides.map((_, index) => {
        const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [8, 24, 8],
          extrapolate: 'clamp',
        });
        const dotOpacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.4, 1, 0.4],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            key={index}
            style={[
              localStyles.dot,
              {
                width: dotWidth,
                backgroundColor: theme.accent,
                opacity: dotOpacity,
              },
            ]}
          />
        );
      })}
    </View>
  );

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      navigation.navigate('Register');
    }
  };

  return (
    <View style={[screenContainer(theme), localStyles.container]}>
      <View style={localStyles.header}>
        <Text style={[styles.heading1, { color: theme.accent }]}>Walk-to-Earn</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />

      {renderDots()}

      <View style={localStyles.footer}>
        <NeumorphicButton
          title={currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
          onPress={handleNext}
          size="large"
          style={{ width: width - 80 }}
        />
        <NeumorphicButton
          title="Already have an account? Sign In"
          onPress={() => navigation.navigate('Login')}
          variant="ghost"
          size="small"
          style={{ marginTop: 12 }}
        />
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: {
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  icon: {
    fontSize: 56,
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
});
