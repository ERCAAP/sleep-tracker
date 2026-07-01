import { Stack } from 'expo-router';
import React from 'react';
import { AuthProvider } from '../contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="auth/register" options={{ headerShown: false }} />
        <Stack.Screen name="auth/forgot-password" options={{ headerShown: false }} />
        <Stack.Screen name="profile/account" options={{ headerShown: false }} />
        <Stack.Screen name="profile/language" options={{ headerShown: false }} />
        <Stack.Screen name="profile/theme" options={{ headerShown: false }} />
        <Stack.Screen name="goals" options={{ presentation: 'modal' }} />
      </Stack>
    </AuthProvider>
  );
}
