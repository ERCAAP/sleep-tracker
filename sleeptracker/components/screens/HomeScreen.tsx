import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import {
    heightPercentageToDP as hp,
    widthPercentageToDP as wp,
} from 'react-native-responsive-screen';

import { SleepScoreCircle } from '../../components/ui/SleepScoreCircle';
import { WeeklyProgressChart } from '../../components/ui/WeeklyProgressChart';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { SleepSession, getRecentSessions } from '../../database/models';
import { t } from '../../locales';

interface QuickActionCardProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
  delay: number;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({ title, icon, color, onPress, delay }) => (
  <Animated.View entering={FadeInUp.duration(500).delay(delay)}>
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={wp(7)} color={color} />
      </View>
      <Text style={styles.quickActionText}>{title}</Text>
    </TouchableOpacity>
  </Animated.View>
);

export function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [lastSleepSession, setLastSleepSession] = useState<SleepSession | null>(null);
  const [weeklyData, setWeeklyData] = useState<SleepSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      loadSleepData(user.uid);
    } else {
      setIsLoading(false); // No user, stop loading
    }
  }, [user]);

  const loadSleepData = async (userId: string) => {
    setIsLoading(true);
    try {
      const sessions = await getRecentSessions(userId);
      setWeeklyData(sessions);
      if (sessions.length > 0) {
        setLastSleepSession(sessions[0]);
      } else {
        setLastSleepSession(null);
      }
    } catch (error) {
      console.error('Failed to load sleep data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('home.goodMorning');
    if (hour < 18) return t('home.goodAfternoon');
    return t('home.goodNight');
  };
  
  const quickActions: Array<{ title: string; icon: keyof typeof Ionicons.glyphMap; color: string; onPress: () => void; }> = [
    { title: t('home.trackSleep'), icon: 'bed-outline', color: Colors.primary[400], onPress: () => router.push('/(tabs)/tracking') },
    { title: t('home.setGoals'), icon: 'trophy-outline', color: Colors.semantic.excellent, onPress: () => router.push('/goals') },
    { title: t('home.dreamJournal'), icon: 'book-outline', color: Colors.sleep.moonbeam, onPress: () => console.log('Dream Journal') },
    { title: t('home.soundscape'), icon: 'musical-notes-outline', color: Colors.semantic.warning, onPress: () => router.push('/(tabs)/sounds') },
  ];

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Animated.View style={styles.header} entering={FadeInDown.duration(500)}>
          <Text style={styles.greeting}>{getGreeting()}, {user?.displayName?.split(' ')[0] || 'User'}!</Text>
          <Text style={styles.headerSubtitle}>{t('home.headerSubtitle')}</Text>
        </Animated.View>

        <Animated.View entering={ZoomIn.duration(600).delay(200)}>
          <View style={styles.mainCard}>
            <Text style={styles.mainCardTitle}>{t('home.lastNightSleep')}</Text>
            {lastSleepSession ? (
              <View style={styles.sleepScoreContainer}>
                <SleepScoreCircle score={lastSleepSession.sleepScore} />
                <View style={styles.sleepDetails}>
                  <Text style={styles.sleepDuration}>{Math.floor(lastSleepSession.totalSleepTime / 3600)}h {Math.floor((lastSleepSession.totalSleepTime % 3600) / 60)}m</Text>
                  <Text style={styles.sleepQuality}>{t('sleep.quality')}: {lastSleepSession.quality}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>{t('home.noSleepData')}</Text>
                <TouchableOpacity style={styles.trackButton} onPress={() => router.push('/(tabs)/tracking')}>
                  <Text style={styles.trackButtonText}>{t('home.startFirstTracking')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Animated.View>
        
        <Animated.View style={styles.section} entering={FadeInUp.duration(500).delay(400)}>
          <Text style={styles.sectionTitle}>{t('home.quickActions')}</Text>
          <View style={styles.quickActionsContainer}>
            {quickActions.map((action, index) => (
              <QuickActionCard key={index} {...action} delay={600 + index * 100} />
            ))}
          </View>
        </Animated.View>

        <Animated.View style={styles.section} entering={FadeInUp.duration(500).delay(600)}>
          <Text style={styles.sectionTitle}>{t('home.weeklyProgress')}</Text>
          <View style={styles.chartContainer}>
            <WeeklyProgressChart data={weeklyData} height={hp(25)} />
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A10',
  },
  scrollContainer: {
    paddingBottom: hp(5),
  },
  header: {
    paddingHorizontal: wp(6),
    paddingTop: hp(6),
    paddingBottom: hp(4),
  },
  greeting: {
    fontSize: wp(7),
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: wp(4),
    color: Colors.neutral[400],
    marginTop: hp(0.5),
  },
  mainCard: {
    backgroundColor: '#11111A',
    borderRadius: 20,
    marginHorizontal: wp(6),
    padding: wp(5),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  mainCardTitle: {
    fontSize: wp(4.5),
    fontWeight: '600',
    color: Colors.neutral[300],
    marginBottom: hp(2),
  },
  sleepScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sleepDetails: {
    marginLeft: wp(5),
  },
  sleepDuration: {
    fontSize: wp(8),
    fontWeight: 'bold',
    color: '#fff',
  },
  sleepQuality: {
    fontSize: wp(4),
    color: Colors.semantic.excellent,
  },
  noDataText: {
    fontSize: wp(4),
    color: Colors.neutral[500],
    textAlign: 'center',
    marginBottom: hp(3),
  },
  section: {
    marginTop: hp(4),
  },
  sectionTitle: {
    fontSize: wp(5),
    fontWeight: 'bold',
    color: '#fff',
    paddingHorizontal: wp(6),
    marginBottom: hp(2),
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: wp(6),
  },
  quickAction: {
    backgroundColor: '#11111A',
    borderRadius: 15,
    width: wp(42),
    padding: wp(4),
    alignItems: 'center',
    marginBottom: wp(4),
  },
  quickActionIcon: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  quickActionText: {
    color: Colors.neutral[200],
    fontWeight: '600',
    fontSize: wp(3.5),
  },
  chartContainer: {
    backgroundColor: '#11111A',
    borderRadius: 20,
    marginHorizontal: wp(6),
    padding: wp(4),
    height: hp(30),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A10',
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: hp(4),
  },
  trackButton: {
    backgroundColor: Colors.primary[500],
    borderRadius: 20,
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(6),
  },
  trackButtonText: {
    color: '#fff',
    fontSize: wp(4),
    fontWeight: 'bold',
  },
}); 