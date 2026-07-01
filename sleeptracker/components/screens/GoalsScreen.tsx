import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    heightPercentageToDP as hp,
    widthPercentageToDP as wp,
} from 'react-native-responsive-screen';

import { Colors } from '../../constants/Colors';

export interface SleepGoal {
  id: string;
  type: 'duration' | 'consistency' | 'quality' | 'bedtime';
  title: string;
  description: string;
  target: number; // target value
  current: number; // current value
  unit: string;
  icon: string;
  color: string;
  isCompleted: boolean;
  completedDate?: string;
  streak: number; // consecutive days achieved
  bestStreak: number; // best streak ever
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  isUnlocked: boolean;
  unlockedDate?: string;
  category: 'sleep' | 'consistency' | 'streak' | 'quality';
  requirement: {
    type: string;
    value: number;
  };
}

const defaultGoals: Omit<SleepGoal, 'current' | 'isCompleted' | 'streak' | 'bestStreak'>[] = [
  {
    id: 'sleep_duration',
    type: 'duration',
    title: 'Günlük Uyku Süresi',
    description: 'Her gece hedef uyku süresine ulaşın',
    target: 8,
    unit: 'saat',
    icon: 'time',
    color: Colors.semantic.info,
  },
  {
    id: 'bedtime_consistency',
    type: 'consistency',
    title: 'Yatma Saati Tutarlılığı',
    description: 'Her gece aynı saatlerde yatın (±30 dk)',
    target: 90,
    unit: '%',
    icon: 'checkmark-circle',
    color: Colors.semantic.excellent,
  },
  {
    id: 'sleep_quality',
    type: 'quality',
    title: 'Uyku Kalitesi',
    description: 'Ortalama uyku kalitenizi artırın',
    target: 4,
    unit: '/5',
    icon: 'star',
    color: Colors.semantic.warning,
  },
  {
    id: 'early_bedtime',
    type: 'bedtime',
    title: 'Erken Yatma',
    description: 'Gece 23:00\'dan önce yatın',
    target: 23,
    unit: ':00',
    icon: 'moon',
    color: Colors.semantic.good,
  },
];

const achievements: Achievement[] = [
  {
    id: 'first_night',
    title: 'İlk Gece',
    description: 'İlk uyku takibinizi tamamladınız',
    icon: 'star',
    color: Colors.semantic.info,
    isUnlocked: false,
    category: 'sleep',
    requirement: { type: 'sessions_count', value: 1 },
  },
  {
    id: 'week_streak',
    title: 'Haftalık Tutarlılık',
    description: '7 gün boyunca hedeflerinize ulaştınız',
    icon: 'trophy',
    color: Colors.semantic.excellent,
    isUnlocked: false,
    category: 'streak',
    requirement: { type: 'streak_days', value: 7 },
  },
  {
    id: 'early_bird',
    title: 'Erken Kuş',
    description: '10 gün boyunca 23:00\'dan önce yattınız',
    icon: 'sunny',
    color: Colors.semantic.warning,
    isUnlocked: false,
    category: 'consistency',
    requirement: { type: 'early_bedtime_count', value: 10 },
  },
  {
    id: 'quality_master',
    title: 'Kalite Ustası',
    description: 'Uyku kaliteniz 1 ay boyunca 4+ oldu',
    icon: 'diamond',
    color: Colors.semantic.good,
    isUnlocked: false,
    category: 'quality',
    requirement: { type: 'quality_streak', value: 30 },
  },
  {
    id: 'month_champion',
    title: 'Aylık Şampiyon',
    description: '30 gün boyunca tüm hedeflerinize ulaştınız',
    icon: 'ribbon',
    color: Colors.primary[400],
    isUnlocked: false,
    category: 'streak',
    requirement: { type: 'perfect_month', value: 30 },
  },
];

export default function GoalsScreen() {
  const [goals, setGoals] = useState<SleepGoal[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'goals' | 'achievements'>('goals');
  const router = useRouter();

  useEffect(() => {
    loadGoalsAndAchievements();
  }, []);

  const loadGoalsAndAchievements = async () => {
    setIsLoading(true);
    try {
      // Load goals from storage
      const storedGoals = await AsyncStorage.getItem('sleep_goals');
      if (storedGoals) {
        setGoals(JSON.parse(storedGoals));
      } else {
        // Initialize with default goals
        const initialGoals = defaultGoals.map(goal => ({
          ...goal,
          current: 0,
          isCompleted: false,
          streak: 0,
          bestStreak: 0,
        }));
        setGoals(initialGoals);
        await AsyncStorage.setItem('sleep_goals', JSON.stringify(initialGoals));
      }

      // Load achievements from storage
      const storedAchievements = await AsyncStorage.getItem('achievements');
      if (storedAchievements) {
        setUnlockedAchievements(JSON.parse(storedAchievements));
      }
    } catch (error) {
      console.error('Failed to load goals and achievements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateGoal = async (goalId: string, updates: Partial<SleepGoal>) => {
    try {
      const updatedGoals = goals.map(goal =>
        goal.id === goalId ? { ...goal, ...updates } : goal
      );
      setGoals(updatedGoals);
      await AsyncStorage.setItem('sleep_goals', JSON.stringify(updatedGoals));
    } catch (error) {
      console.error('Failed to update goal:', error);
    }
  };

  const unlockAchievement = async (achievementId: string) => {
    try {
      const achievement = achievements.find(a => a.id === achievementId);
      if (!achievement || unlockedAchievements.some(a => a.id === achievementId)) {
        return; // Already unlocked or doesn't exist
      }

      const unlockedAchievement = {
        ...achievement,
        isUnlocked: true,
        unlockedDate: new Date().toISOString(),
      };

      const updatedAchievements = [...unlockedAchievements, unlockedAchievement];
      setUnlockedAchievements(updatedAchievements);
      await AsyncStorage.setItem('achievements', JSON.stringify(updatedAchievements));

      // Show achievement notification
      Alert.alert(
        '🏆 Başarım Kazandınız!',
        `${achievement.title}\n${achievement.description}`,
        [{ text: 'Harika!', style: 'default' }]
      );
    } catch (error) {
      console.error('Failed to unlock achievement:', error);
    }
  };

  const calculateProgress = (goal: SleepGoal): number => {
    if (goal.target === 0) return 0;
    return Math.min(100, (goal.current / goal.target) * 100);
  };

  const getProgressColor = (progress: number): string => {
    if (progress >= 100) return Colors.semantic.excellent;
    if (progress >= 75) return Colors.semantic.good;
    if (progress >= 50) return Colors.semantic.warning;
    return Colors.semantic.error;
  };

  const renderGoalCard = ({ item }: { item: SleepGoal }) => {
    const progress = calculateProgress(item);
    const progressColor = getProgressColor(progress);

    return (
      <TouchableOpacity
        style={[styles.goalCard, item.isCompleted && styles.completedGoalCard]}
        onPress={() => showGoalDetails(item)}
      >
        <View style={styles.goalHeader}>
          <View style={[styles.goalIconContainer, { backgroundColor: item.color + '20' }]}>
            <Ionicons name={item.icon as any} size={24} color={item.color} />
          </View>
          <View style={styles.goalInfo}>
            <Text style={styles.goalTitle}>{item.title}</Text>
            <Text style={styles.goalDescription}>{item.description}</Text>
          </View>
          {item.isCompleted && (
            <Ionicons name="checkmark-circle" size={24} color={Colors.semantic.excellent} />
          )}
        </View>

        <View style={styles.goalProgress}>
          <View style={styles.progressContainer}>
            <View style={styles.progressBackground}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress}%`, backgroundColor: progressColor }
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {item.current}{item.unit} / {item.target}{item.unit}
            </Text>
          </View>
        </View>

        <View style={styles.goalStats}>
          <View style={styles.goalStat}>
            <Text style={styles.goalStatValue}>{item.streak}</Text>
            <Text style={styles.goalStatLabel}>Seri</Text>
          </View>
          <View style={styles.goalStat}>
            <Text style={styles.goalStatValue}>{item.bestStreak}</Text>
            <Text style={styles.goalStatLabel}>En İyi</Text>
          </View>
          <View style={styles.goalStat}>
            <Text style={styles.goalStatValue}>{Math.round(progress)}%</Text>
            <Text style={styles.goalStatLabel}>İlerleme</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderAchievementCard = ({ item }: { item: Achievement }) => (
    <TouchableOpacity
      style={[
        styles.achievementCard,
        !item.isUnlocked && styles.lockedAchievementCard
      ]}
      onPress={() => showAchievementDetails(item)}
    >
      <View style={styles.achievementHeader}>
        <View style={[
          styles.achievementIconContainer,
          { backgroundColor: item.color + (item.isUnlocked ? '20' : '10') }
        ]}>
          <Ionicons 
            name={item.icon as any} 
            size={24} 
            color={item.isUnlocked ? item.color : Colors.neutral[500]} 
          />
        </View>
        <View style={styles.achievementInfo}>
          <Text style={[
            styles.achievementTitle,
            !item.isUnlocked && styles.lockedText
          ]}>
            {item.title}
          </Text>
          <Text style={[
            styles.achievementDescription,
            !item.isUnlocked && styles.lockedText
          ]}>
            {item.description}
          </Text>
          {item.unlockedDate && (
            <Text style={styles.achievementDate}>
              {new Date(item.unlockedDate).toLocaleDateString('tr-TR')}
            </Text>
          )}
        </View>
        {item.isUnlocked && (
          <Ionicons name="star" size={20} color={Colors.semantic.warning} />
        )}
      </View>
    </TouchableOpacity>
  );

  const showGoalDetails = (goal: SleepGoal) => {
    Alert.alert(
      goal.title,
      `${goal.description}\n\nMevcut: ${goal.current}${goal.unit}\nHedef: ${goal.target}${goal.unit}\nSeri: ${goal.streak} gün\nEn İyi Seri: ${goal.bestStreak} gün`,
      [{ text: 'Tamam', style: 'default' }]
    );
  };

  const showAchievementDetails = (achievement: Achievement) => {
    const status = achievement.isUnlocked ? 'Kazanıldı' : 'Kilitli';
    const date = achievement.unlockedDate 
      ? `\nKazanılma Tarihi: ${new Date(achievement.unlockedDate).toLocaleDateString('tr-TR')}`
      : '';
    
    Alert.alert(
      achievement.title,
      `${achievement.description}\n\nDurum: ${status}${date}`,
      [{ text: 'Tamam', style: 'default' }]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={Colors.gradients.night as any} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Hedefler yükleniyor...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const completedGoals = goals.filter(goal => goal.isCompleted).length;
  const totalUnlockedAchievements = unlockedAchievements.length;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={Colors.gradients.night as any} style={styles.gradient}>
        <ScrollView style={styles.scrollView}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color={Colors.neutral[100]} />
            </TouchableOpacity>
            <Text style={styles.title}>Hedefler & Başarımlar</Text>
          </View>

          {/* Stats Summary */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{completedGoals}/{goals.length}</Text>
              <Text style={styles.summaryLabel}>Tamamlanan Hedef</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{totalUnlockedAchievements}</Text>
              <Text style={styles.summaryLabel}>Kazanılan Başarım</Text>
            </View>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, selectedTab === 'goals' && styles.activeTabButton]}
              onPress={() => setSelectedTab('goals')}
            >
              <Ionicons 
                name="trophy" 
                size={20} 
                color={selectedTab === 'goals' ? Colors.neutral[100] : Colors.neutral[400]} 
              />
              <Text style={[
                styles.tabButtonText,
                selectedTab === 'goals' && styles.activeTabButtonText
              ]}>
                Hedefler
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, selectedTab === 'achievements' && styles.activeTabButton]}
              onPress={() => setSelectedTab('achievements')}
            >
              <Ionicons 
                name="trophy" 
                size={20} 
                color={selectedTab === 'achievements' ? Colors.neutral[100] : Colors.neutral[400]} 
              />
              <Text style={[
                styles.tabButtonText,
                selectedTab === 'achievements' && styles.activeTabButtonText
              ]}>
                Başarımlar
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.contentContainer}>
            {selectedTab === 'goals' ? (
              <FlatList
                data={goals}
                renderItem={renderGoalCard}
                keyExtractor={item => item.id}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={styles.cardSeparator} />}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>Henüz hedef bulunmuyor</Text>
                }
              />
            ) : (
              <FlatList
                data={[...unlockedAchievements, ...achievements.filter(a => !unlockedAchievements.some(ua => ua.id === a.id))]}
                renderItem={renderAchievementCard}
                keyExtractor={item => item.id}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={styles.cardSeparator} />}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>Henüz başarım kazanılmamış</Text>
                }
              />
            )}
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.neutral[100],
    fontSize: 18,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingTop: hp(6),
    paddingBottom: hp(2),
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.neutral[100],
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: wp(5),
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.neutral[100],
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.neutral[400],
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: wp(5),
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeTabButton: {
    backgroundColor: Colors.primary[600],
    borderColor: Colors.primary[400],
  },
  tabButtonText: {
    color: Colors.neutral[400],
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  activeTabButtonText: {
    color: Colors.neutral[100],
  },
  contentContainer: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(10),
  },
  goalCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  completedGoalCard: {
    borderColor: Colors.semantic.excellent + '50',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral[100],
    marginBottom: 4,
  },
  goalDescription: {
    fontSize: 14,
    color: Colors.neutral[400],
  },
  goalProgress: {
    marginBottom: 12,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBackground: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: Colors.neutral[300],
    textAlign: 'center',
  },
  goalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  goalStat: {
    alignItems: 'center',
  },
  goalStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.neutral[100],
  },
  goalStatLabel: {
    fontSize: 12,
    color: Colors.neutral[400],
    marginTop: 2,
  },
  achievementCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  lockedAchievementCard: {
    opacity: 0.6,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral[100],
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: Colors.neutral[400],
  },
  achievementDate: {
    fontSize: 12,
    color: Colors.semantic.good,
    marginTop: 4,
  },
  lockedText: {
    color: Colors.neutral[500],
  },
  cardSeparator: {
    height: 12,
  },
  emptyText: {
    color: Colors.neutral[400],
    fontSize: 16,
    textAlign: 'center',
    marginTop: 32,
  },
}); 