import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';
import {
    heightPercentageToDP as hp,
    widthPercentageToDP as wp,
} from 'react-native-responsive-screen';

import { Colors } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { saveUserSleepGoals } from '../../database/models';
import { t } from '../../locales';
import NotificationService from '../../services/notificationService';

const { width } = Dimensions.get('window');

interface OnboardingSlideProps {
  item: any;
  props: {
    selectedGoals: string[];
    setSelectedGoals: React.Dispatch<React.SetStateAction<string[]>>;
  };
}

const OnboardingSlide: React.FC<OnboardingSlideProps> = ({ item, props }) => {
  return (
    <View style={[styles.slide, { width }]}>
      <Animated.View entering={ZoomIn.duration(700)} style={styles.iconContainer}>
        <Ionicons name={item.icon} size={wp(25)} color={Colors.primary[400]} />
      </Animated.View>
      <Animated.Text entering={FadeInUp.delay(200).duration(500)} style={styles.title}>
        {item.title}
      </Animated.Text>
      <Animated.Text entering={FadeInUp.delay(400).duration(500)} style={styles.description}>
        {item.description}
      </Animated.Text>
      {item.content && item.content(props)}
    </View>
  );
};

export default function OnboardingScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const handlePermissions = async () => {
    const notificationService = NotificationService.getInstance();
    const hasPermission = await notificationService.requestPermissions();
    if (hasPermission) {
      Alert.alert(t('common.great'), t('onboarding.permissionsGranted'));
      handleNext();
    } else {
      Alert.alert(t('common.permissionDenied'), t('onboarding.permissionsDenied'));
    }
  };

  const onboardingSlides = [
    {
      key: 'welcome',
      title: t('onboarding.welcome'),
      description: t('onboarding.welcomeDescription'),
      icon: 'bed-outline',
    },
    {
      key: 'goals',
      title: t('onboarding.sleepGoalsTitle'),
      description: t('onboarding.sleepGoalsDescription'),
      icon: 'trophy-outline',
      content: ({ selectedGoals, setSelectedGoals }: { selectedGoals: string[], setSelectedGoals: React.Dispatch<React.SetStateAction<string[]>> }) => {
        const toggleGoal = (goal: string) => {
          setSelectedGoals((prev) =>
            prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
          );
        };
        const goals = [
          { id: 'improve_quality', label: t('onboarding.goalImproveQuality') },
          { id: 'regular_schedule', label: t('onboarding.goalRegularSchedule') },
          { id: 'reduce_snoring', label: t('onboarding.goalReduceSnoring') },
          { id: 'just_explore', label: t('onboarding.goalJustExplore') },
        ];
        return (
          <View style={styles.goalsContainer}>
            {goals.map((goal) => (
              <TouchableOpacity
                key={goal.id}
                style={[
                  styles.goalButton,
                  selectedGoals.includes(goal.id) && styles.goalButtonSelected,
                ]}
                onPress={() => toggleGoal(goal.id)}
              >
                <Text
                  style={[
                    styles.goalButtonText,
                    selectedGoals.includes(goal.id) && styles.goalButtonTextSelected,
                  ]}
                >
                  {goal.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      },
    },
    {
      key: 'permissions',
      title: t('onboarding.permissionsTitle'),
      description: t('onboarding.permissionsDescription'),
      icon: 'notifications-outline',
      content: () => (
        <TouchableOpacity style={styles.permissionButton} onPress={handlePermissions}>
          <Text style={styles.permissionButtonText}>{t('onboarding.grantPermissions')}</Text>
        </TouchableOpacity>
      ),
    },
  ];

  const handleNext = () => {
    if (currentIndex < onboardingSlides.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex });
      setCurrentIndex(nextIndex);
    } else {
      finishOnboarding();
    }
  };

  const finishOnboarding = async () => {
    if (user?.uid && selectedGoals.length > 0) {
      await saveUserSleepGoals(user.uid, selectedGoals);
    }
    await AsyncStorage.setItem('onboarding_completed', 'true');
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={onboardingSlides}
        renderItem={({ item }) => (
          <OnboardingSlide item={item} props={{ selectedGoals, setSelectedGoals }} />
        )}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
      />
      <View style={styles.footer}>
        <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
          <Text style={styles.nextButtonText}>
            {currentIndex === onboardingSlides.length - 1 ? t('common.finish') : t('common.continue')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A10',
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: wp(10),
  },
  iconContainer: {
    marginBottom: hp(5),
  },
  title: {
    fontSize: wp(7),
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: hp(2),
  },
  description: {
    fontSize: wp(4.5),
    color: Colors.neutral[400],
    textAlign: 'center',
    marginBottom: hp(5),
  },
  footer: {
    paddingBottom: hp(5),
    paddingHorizontal: wp(10),
  },
  nextButton: {
    backgroundColor: Colors.primary[500],
    borderRadius: 30,
    paddingVertical: hp(2),
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: wp(4.5),
    fontWeight: 'bold',
  },
  goalsContainer: {
    width: '100%',
  },
  goalButton: {
    borderRadius: 15,
    padding: wp(4),
    marginBottom: hp(2),
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  goalButtonSelected: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[400],
  },
  goalButtonText: {
    color: '#fff',
    fontSize: wp(4),
    fontWeight: '600',
  },
  goalButtonTextSelected: {
    color: '#fff',
  },
  permissionButton: {
    backgroundColor: Colors.primary[500],
    borderRadius: 25,
    paddingVertical: hp(2),
    paddingHorizontal: wp(10),
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: wp(4.5),
    fontWeight: 'bold',
  },
}); 