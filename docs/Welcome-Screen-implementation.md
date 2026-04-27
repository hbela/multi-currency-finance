import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

const WELCOME_SHOWN_KEY = '@task_manager_welcome_shown';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [shouldShowWelcome, setShouldShowWelcome] = useState(false);

  useEffect(() => {
    checkWelcomeStatus();
  }, []);

  const checkWelcomeStatus = async () => {
    try {
      const hasSeenWelcome = await AsyncStorage.getItem(WELCOME_SHOWN_KEY);
      // Logic: Show if 'true' or null (default). Hide if 'false' (disabled).
      setShouldShowWelcome(hasSeenWelcome !== 'false');
    } catch (error) {
      console.error('Error checking welcome status:', error);
      setShouldShowWelcome(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (shouldShowWelcome) {
    return <Redirect href="/welcome" />;
  }

  return <Redirect href="/(app)" />;
}


import ScreenshotCaptureButton from '@/components/ScreenshotCaptureButton';
import { useTranslation } from '@/hooks/useTranslation';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Text, useTheme } from 'react-native-paper';

const WELCOME_SHOWN_KEY = '@task_manager_welcome_shown';

export default function WelcomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();

  const handleDismiss = async () => {
    try {
      await AsyncStorage.setItem(WELCOME_SHOWN_KEY, 'false');
      router.replace('/(app)');
    } catch (error) {
      console.error('Error saving welcome preference:', error);
      router.replace('/(app)');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.screenshotButtonContainer}>
        <ScreenshotCaptureButton screenName="welcome" />
      </View>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Image 
              source={require('../assets/images/icons/icon.png')}
              style={styles.appIcon}
              resizeMode="contain"
            />
          </View>
          <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
            {t('welcome.title')}
          </Text>
          <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            {t('welcome.subtitle')}
          </Text>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <Card style={styles.featureCard} mode="elevated">
            <Card.Content style={styles.featureContent}>
              <MaterialCommunityIcons 
                name="clipboard-check-outline" 
                size={32} 
                color={theme.colors.primary} 
              />
              <View style={styles.featureText}>
                <Text variant="titleSmall" style={{ fontWeight: '600' }}>
                  {t('welcome.feature1Title')}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {t('welcome.feature1Description')}
                </Text>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.featureCard} mode="elevated">
            <Card.Content style={styles.featureContent}>
              <MaterialCommunityIcons 
                name="account-circle-outline" 
                size={32} 
                color={theme.colors.primary} 
              />
              <View style={styles.featureText}>
                <Text variant="titleSmall" style={{ fontWeight: '600' }}>
                  {t('welcome.feature2Title')}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {t('welcome.feature2Description')}
                </Text>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.featureCard} mode="elevated">
            <Card.Content style={styles.featureContent}>
              <MaterialCommunityIcons 
                name="microphone-outline" 
                size={32} 
                color={theme.colors.primary} 
              />
              <View style={styles.featureText}>
                <Text variant="titleSmall" style={{ fontWeight: '600' }}>
                  {t('welcome.feature3Title')}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {t('welcome.feature3Description')}
                </Text>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.featureCard} mode="elevated">
            <Card.Content style={styles.featureContent}>
              <MaterialCommunityIcons 
                name="calendar-month-outline" 
                size={32} 
                color={theme.colors.primary} 
              />
              <View style={styles.featureText}>
                <Text variant="titleSmall" style={{ fontWeight: '600' }}>
                  {t('welcome.feature4Title')}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {t('welcome.feature4Description')}
                </Text>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.featureCard} mode="elevated">
            <Card.Content style={styles.featureContent}>
              <MaterialCommunityIcons 
                name="translate" 
                size={32} 
                color={theme.colors.primary} 
              />
              <View style={styles.featureText}>
                <Text variant="titleSmall" style={{ fontWeight: '600' }}>
                  {t('welcome.feature5Title')}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {t('welcome.feature5Description')}
                </Text>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.featureCard} mode="elevated">
            <Card.Content style={styles.featureContent}>
              <MaterialCommunityIcons 
                name="google-drive" 
                size={32} 
                color={theme.colors.primary} 
              />
              <View style={styles.featureText}>
                <Text variant="titleSmall" style={{ fontWeight: '600' }}>
                  {t('welcome.feature6Title')}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {t('welcome.feature6Description')}
                </Text>
              </View>
            </Card.Content>
          </Card>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text variant="bodySmall" style={[styles.footerText, { color: theme.colors.onSurfaceVariant, fontStyle: 'italic' }]}>
            {t('welcome.disableHint')}
          </Text>
          <Text variant="bodySmall" style={[styles.footerText, { color: theme.colors.onSurfaceVariant, marginTop: 8 }]}>
            {t('welcome.footerCopyright')}
          </Text>
        </View>

        {/* Dismiss Button */}
        <Button 
          mode="contained" 
          onPress={handleDismiss}
          style={styles.dismissButton}
          contentStyle={styles.dismissButtonContent}
        >
          {t('welcome.getStarted')}
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  appIcon: {
    width: 120,
    height: 120,
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  featuresContainer: {
    gap: 16,
    marginBottom: 32,
  },
  featureCard: {
    borderRadius: 12,
  },
  featureContent: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  featureText: {
    flex: 1,
    gap: 4,
  },
  footer: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 4,
  },
  footerText: {
    textAlign: 'center',
  },
  dismissButton: {
    borderRadius: 8,
    marginBottom: 20,
  },
  dismissButtonContent: {
    height: 48,
  },
  screenshotButtonContainer: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
  },
});
