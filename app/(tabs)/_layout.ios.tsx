
import React from 'react';
import { Platform } from 'react-native';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';

export const unstable_settings = {
  initialRouteName: '(home)',
};

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
      {
        name: '(guide)',
        route: '/(tabs)/(guide)/',
        icon: 'menu-book',
        label: 'Guide',
      },
    ];

    return (
      <>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'none',
          }}
          initialRouteName="(home)"
        >
          <Stack.Screen key="home" name="(home)" />
          <Stack.Screen key="guide" name="(guide)" />
        </Stack>
        <FloatingTabBar tabs={tabs} />
      </>
    );
  }

  // On iPhone, use native tabs
  return (
    <NativeTabs initialRouteName="(home)">
      <NativeTabs.Trigger key="home" name="(home)">
        <Icon sf="house.fill" />
        <Label>Projects</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="guide" name="(guide)">
        <Icon sf="book.closed.fill" />
        <Label>Guide</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
