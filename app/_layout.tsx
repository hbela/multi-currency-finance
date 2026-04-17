import '@/src/i18n';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { PaperProvider, adaptNavigationTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  DarkTheme as NavDarkTheme,
  DefaultTheme as NavLightTheme,
  ThemeProvider,
} from '@react-navigation/native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { ScreenshotProvider } from '@/src/context/ScreenshotContext';
import { runMigrations } from '@/src/db/migrations';
import { seedIfEmpty } from '@/src/db/seed';
import { useAccountStore } from '@/src/store/accountStore';
import { useCategoryStore } from '@/src/store/categoryStore';
import { useTransactionStore } from '@/src/store/transactionStore';
import { useBudgetStore } from '@/src/store/budgetStore';
import { useRecurringStore } from '@/src/store/recurringStore';
import { useThemeStore } from '@/src/store/themeStore';
import { processDueRecurring } from '@/src/db/recurring';
import { darkTheme, lightTheme } from '@/src/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

const { LightTheme: NavLight, DarkTheme: NavDark } = adaptNavigationTheme({
  reactNavigationLight: NavLightTheme,
  reactNavigationDark: NavDarkTheme,
  materialLight: lightTheme,
  materialDark: darkTheme,
});

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const systemScheme = useColorScheme();
  const themeMode = useThemeStore((s) => s.mode);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await runMigrations();
        await seedIfEmpty();
        await processDueRecurring();
        await Promise.all([
          useAccountStore.getState().load(),
          useCategoryStore.getState().load(),
          useTransactionStore.getState().load(),
          useBudgetStore.getState().load(),
          useRecurringStore.getState().load(),
          useThemeStore.getState().load(),
        ]);
      } finally {
        setReady(true);
        SplashScreen.hideAsync().catch(() => {});
      }
    })();
  }, []);

  if (!ready) return null;

  const isDark =
    themeMode === 'system' ? systemScheme === 'dark' : themeMode === 'dark';
  const paperTheme = isDark ? darkTheme : lightTheme;
  const navTheme = isDark ? NavDark : NavLight;

  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <ScreenshotProvider>
        <ThemeProvider value={navTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="transaction/new"
              options={{ presentation: 'modal', title: 'New transaction' }}
            />
            <Stack.Screen
              name="transaction/[id]"
              options={{ presentation: 'modal', title: 'Edit transaction' }}
            />
            <Stack.Screen name="recurring/index" options={{ title: 'Recurring' }} />
            <Stack.Screen
              name="recurring/new"
              options={{ presentation: 'modal', title: 'New recurring' }}
            />
            <Stack.Screen
              name="recurring/[id]"
              options={{ presentation: 'modal', title: 'Edit recurring' }}
            />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
        </ScreenshotProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
