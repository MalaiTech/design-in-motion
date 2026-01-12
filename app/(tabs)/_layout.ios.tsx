
import React from 'react';
import { Platform } from 'react-native';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';

export default function TabLayout() {
  // Check if device is iPad
  const isIPad = Platform.OS === 'ios' && Platform.isPad;

  // On iPad, use FloatingTabBar (same as Android/Web)
  if (isIPad) {
    const tabs: TabBarItem[] = [
      {
        name: '(home)',
        route: '/(tabs)/(home)/',
        icon: 'home',
        label: 'Projects',
      },
    ];

    return (
      <>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'none',
          }}
        >
          <Stack.Screen key="home" name="(home)" />
        </Stack>
        <FloatingTabBar tabs={tabs} />
      </>
    );
  }

  // On iPhone, use native tabs
  return (
    <NativeTabs>
      <NativeTabs.Trigger key="home" name="(home)">
        <Icon sf="house.fill" />
        <Label>Projects</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
