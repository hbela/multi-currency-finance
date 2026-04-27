import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { setSetting } from '@/src/db/settings';
import { useAppTheme } from '@/src/theme';

type Feature = {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  titleKey: string;
  descKey: string;
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 24 },
  header: { alignItems: 'center', marginBottom: 28 },
  iconRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  appIcon: { width: 116, height: 116 },
  title: { fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  subtitle: { textAlign: 'center', lineHeight: 22 },
  features: { gap: 12, marginBottom: 28 },
  card: { borderRadius: 12 },
  cardContent: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  cardText: { flex: 1, gap: 3 },
  hint: { textAlign: 'center', fontStyle: 'italic', marginBottom: 20 },
  cta: { borderRadius: 8 },
  ctaContent: { height: 48 },
});

const FEATURES: Feature[] = [
  { icon: 'swap-horizontal', titleKey: 'welcome.feature1Title', descKey: 'welcome.feature1Desc' },
  { icon: 'wallet-outline', titleKey: 'welcome.feature2Title', descKey: 'welcome.feature2Desc' },
  { icon: 'chart-bar', titleKey: 'welcome.feature3Title', descKey: 'welcome.feature3Desc' },
  { icon: 'chart-pie', titleKey: 'welcome.feature4Title', descKey: 'welcome.feature4Desc' },
  { icon: 'repeat', titleKey: 'welcome.feature5Title', descKey: 'welcome.feature5Desc' },
  { icon: 'wifi-off', titleKey: 'welcome.feature6Title', descKey: 'welcome.feature6Desc' },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const handleGetStarted = async () => {
    await setSetting('show_welcome', 'false');
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <View style={[styles.iconRing, { borderColor: theme.colors.primaryContainer }]}>
            <Image
              source={require('../assets/images/screen.png')}
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

        <View style={styles.features}>
          {FEATURES.map((f) => (
            <Card key={f.titleKey} style={styles.card} mode="elevated">
              <Card.Content style={styles.cardContent}>
                <MaterialCommunityIcons name={f.icon} size={30} color={theme.colors.primary} />
                <View style={styles.cardText}>
                  <Text variant="titleSmall" style={{ fontWeight: '600' }}>
                    {t(f.titleKey)}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {t(f.descKey)}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>

        <Text
          variant="bodySmall"
          style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}>
          {t('welcome.disableHint')}
        </Text>

        <Button
          mode="contained"
          onPress={handleGetStarted}
          style={styles.cta}
          contentStyle={styles.ctaContent}>
          {t('welcome.getStarted')}
        </Button>
      </ScrollView>
    </View>
  );
}
