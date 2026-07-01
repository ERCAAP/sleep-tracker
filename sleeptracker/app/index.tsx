import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import OnboardingScreen from '../components/screens/OnboardingScreen';
import { useAuth } from '../contexts/AuthContext';

export default function Index() {
  const { user, isLoading } = useAuth();
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const completed = await AsyncStorage.getItem('onboarding_completed');
      setOnboardingCompleted(completed === 'true');
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setOnboardingCompleted(false);
    }
  };

  // Loading state
  if (isLoading || onboardingCompleted === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A10' }}>
        <Text style={{ color: '#fff' }}>Loading...</Text>
      </View>
    );
  }

  // Show onboarding if not completed
  if (!onboardingCompleted) {
    return <OnboardingScreen />;
  }

  // If onboarding completed and user logged in, go to tabs
  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  // If onboarding completed but no user, go to login
  return <Redirect href="/auth/login" />;
}
