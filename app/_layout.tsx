import {
  DarkTheme as NavDarkTheme,
  DefaultTheme as NavLightTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { PaperProvider, adaptNavigationTheme } from 'react-native-paper';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';
import ScreenshotStatusSnackbar from '@/src/components/ScreenshotStatusSnackbar';
import { ScreenshotProvider } from '@/src/context/ScreenshotContext';
import { resetDatabase } from '@/src/db/db';
import { runMigrations } from '@/src/db/migrations';
import { seedIfEmpty } from '@/src/db/seed';
import { getSetting } from '@/src/db/settings';
import { processRecurringTransactions } from '@/src/db/transactions';
import i18n from '@/src/i18n';
import { useAccountStore } from '@/src/store/accountStore';
import { useBudgetStore } from '@/src/store/budgetStore';
import { useCategoryStore } from '@/src/store/categoryStore';
import { useThemeStore } from '@/src/store/themeStore';
import { useTransactionStore } from '@/src/store/transactionStore';
import { darkTheme, lightTheme } from '@/src/theme';
import { useTranslation } from 'react-i18next';


SplashScreen.preventAutoHideAsync().catch(() => { });

const queryClient = new QueryClient();

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
  const { t } = useTranslation();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await runMigrations();
        await resetDatabase();
        await seedIfEmpty();
        await processRecurringTransactions();
        const savedLang = await getSetting('app_language');
        const supported = ['en', 'hu', 'de', 'fr'];
        if (savedLang && supported.includes(savedLang) && savedLang !== i18n.language) {
          await i18n.changeLanguage(savedLang);
        }
        await Promise.all([
          useAccountStore.getState().load(),
          useCategoryStore.getState().load(),
          useTransactionStore.getState().load(),
          useBudgetStore.getState().load(),
          useThemeStore.getState().load(),
        ]);
        const welcomeSetting = await getSetting('show_welcome');
        setShowWelcome(welcomeSetting !== 'false');
      } finally {
        setReady(true);
        SplashScreen.hideAsync().catch(() => { });
      }
    })();
  }, []);

  useEffect(() => {
    if (ready && showWelcome) {
      router.replace('/welcome');
    }
  }, [ready, showWelcome]);

  if (!ready) return null;

  const isDark =
    themeMode === 'system' ? systemScheme === 'dark' : themeMode === 'dark';
  const paperTheme = isDark ? darkTheme : lightTheme;
  const navTheme = isDark ? NavDark : NavLight;

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <PaperProvider theme={paperTheme}>
          <ScreenshotProvider>
            <ThemeProvider value={navTheme}>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="welcome" options={{ headerShown: false }} />
                <Stack.Screen
                  name="transaction/new"
                  options={{ presentation: 'modal', title: t('nav.newTransaction') }}
                />
                <Stack.Screen
                  name="transaction/[id]"
                  options={{ presentation: 'modal', title: t('nav.editTransaction') }}
                />
              </Stack>
              <StatusBar style="auto" />
              <ScreenshotStatusSnackbar />
            </ThemeProvider>
          </ScreenshotProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
