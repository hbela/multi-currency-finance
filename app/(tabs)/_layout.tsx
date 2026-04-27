import { Tabs } from 'expo-router';
import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { HapticTab } from '@/components/haptic-tab';
import { useAppTheme } from '@/src/theme';
import ScreenshotCaptureButton from '@/src/components/ScreenshotCaptureButton';

export default function TabLayout() {
  const theme = useAppTheme();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.elevation.level2,
          borderTopColor: theme.colors.outlineVariant,
        },
        headerStyle: { backgroundColor: theme.colors.elevation.level2 },
        headerTintColor: theme.colors.onSurface,
        headerShown: true,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('nav.dashboard'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" color={color} size={size} />
          ),
          headerRight: () => <ScreenshotCaptureButton screenName="dashboard" />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: t('nav.transactions'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="swap-horizontal" color={color} size={size} />
          ),
          headerRight: () => <ScreenshotCaptureButton screenName="transactions" />,
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          title: t('nav.budgets'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="wallet" color={color} size={size} />
          ),
          headerRight: () => <ScreenshotCaptureButton screenName="budgets" />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: t('nav.reports'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chart-pie" color={color} size={size} />
          ),
          headerRight: () => <ScreenshotCaptureButton screenName="reports" />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('nav.settings'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" color={color} size={size} />
          ),
          headerRight: () => <ScreenshotCaptureButton screenName="settings" />,
        }}
      />
      <Tabs.Screen
        name="support"
        options={{
          title: t('nav.support'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="heart" color={color} size={size} />
          ),
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
