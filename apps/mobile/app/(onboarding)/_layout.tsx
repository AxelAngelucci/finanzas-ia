import React from 'react';
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="income" />
      <Stack.Screen name="whatsapp" />
      <Stack.Screen name="wa-login" />
    </Stack>
  );
}
