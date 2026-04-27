import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  Button,
  Chip,
  Dialog,
  Divider,
  IconButton,
  List,
  Portal,
  SegmentedButtons,
  Snackbar,
  Switch,
  Text,
  TextInput,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useScreenshot, DEVICE_DIMENSIONS, DeviceType } from '@/src/context/ScreenshotContext';
import { useAccountStore } from '@/src/store/accountStore';
import { useCategoryStore } from '@/src/store/categoryStore';
import { useThemeStore, ThemeMode } from '@/src/store/themeStore';
import { getSetting, setSetting } from '@/src/db/settings';
import { AccountType, TransactionType } from '@/src/types';
import { useAppTheme } from '@/src/theme';
import { exportDatabaseAsCsv } from '@/src/utils/exportCsv';

export default function SettingsScreen() {
  const theme = useAppTheme();
  const { t, i18n } = useTranslation();

  const accounts = useAccountStore((s) => s.items);
  const addAccount = useAccountStore((s) => s.add);
  const removeAccount = useAccountStore((s) => s.remove);
  const categories = useCategoryStore((s) => s.items);
  const addCategory = useCategoryStore((s) => s.add);
  const removeCategory = useCategoryStore((s) => s.remove);
  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);

  const {
    selectedDevice,
    setSelectedDevice,
    capturedScreenshots,
    isUploading,
    uploadAllToGoogleDrive,
    clearAllScreenshots,
  } = useScreenshot();

  const [showWelcome, setShowWelcome] = useState(true);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportSnackbar, setExportSnackbar] = useState<{ visible: boolean; message: string; error: boolean }>({ visible: false, message: '', error: false });

  useEffect(() => {
    getSetting('show_welcome').then((val) => setShowWelcome(val !== 'false'));
  }, []);

  const handleToggleWelcome = async (value: boolean) => {
    setShowWelcome(value);
    await setSetting('show_welcome', value ? 'true' : 'false');
  };

  const handleExportCsv = async () => {
    setExportingCsv(true);
    try {
      await exportDatabaseAsCsv();
      setExportSnackbar({ visible: true, message: t('settings.exportSuccess'), error: false });
    } catch (e) {
      setExportSnackbar({ visible: true, message: `${t('settings.exportError')}: ${e instanceof Error ? e.message : String(e)}`, error: true });
    } finally {
      setExportingCsv(false);
    }
  };

  const [accountOpen, setAccountOpen] = useState(false);
  const [accountName, setAccountName] = useState('');
  const [accountCurrency, setAccountCurrency] = useState('USD');
  const [accountType, setAccountType] = useState<AccountType>('cash');

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryType, setCategoryType] = useState<TransactionType>('EXPENSE');

  const submitAccount = async () => {
    if (!accountName.trim()) return;
    await addAccount({ name: accountName.trim(), type: accountType, currency: accountCurrency.trim() || 'USD' });
    setAccountOpen(false);
    setAccountName('');
    setAccountCurrency('USD');
    setAccountType('cash');
  };

  const submitCategory = async () => {
    if (!categoryName.trim()) return;
    await addCategory({ name: categoryName.trim(), icon: null, type: categoryType });
    setCategoryOpen(false);
    setCategoryName('');
    setCategoryType('EXPENSE');
  };

  const screenshotCountLabel = t(
    capturedScreenshots.length === 1 ? 'settings.screenshotCount_one' : 'settings.screenshotCount_other',
    { count: capturedScreenshots.length }
  );

  return (
    <ScrollView style={{ backgroundColor: theme.colors.background }}>
      {/* Appearance */}
      <List.Section>
        <List.Subheader>{t('settings.appearance')}</List.Subheader>
        <View style={{ paddingHorizontal: 16 }}>
          <SegmentedButtons
            value={themeMode}
            onValueChange={(v) => setThemeMode(v as ThemeMode)}
            buttons={[
              { value: 'system', label: t('settings.themeSystem'), icon: 'theme-light-dark' },
              { value: 'light', label: t('settings.themeLight'), icon: 'white-balance-sunny' },
              { value: 'dark', label: t('settings.themeDark'), icon: 'weather-night' },
            ]}
          />
        </View>
        <List.Item
          title={t('settings.welcomeScreen')}
          description={t('settings.welcomeScreenDesc')}
          left={(p) => <List.Icon {...p} icon="hand-wave" />}
          right={() => (
            <Switch value={showWelcome} onValueChange={handleToggleWelcome} />
          )}
        />
      </List.Section>

      <Divider />

      {/* Language */}
      <List.Section>
        <List.Subheader>{t('settings.language')}</List.Subheader>
        <View style={{ paddingHorizontal: 16 }}>
          <SegmentedButtons
            value={i18n.language}
            onValueChange={(lang) => { i18n.changeLanguage(lang); setSetting('app_language', lang); }}
            buttons={[
              { value: 'en', label: 'EN' },
              { value: 'hu', label: 'HU' },
              { value: 'de', label: 'DE' },
              { value: 'fr', label: 'FR' },
            ]}
          />
        </View>
      </List.Section>

      <Divider />

      {/* Accounts */}
      <List.Section>
        <List.Subheader>{t('settings.accounts')}</List.Subheader>
        {accounts.map((a) => (
          <List.Item
            key={a.id}
            title={a.name}
            description={`${a.type} · ${a.currency}`}
            left={(p) => <List.Icon {...p} icon="wallet" />}
            right={() => (
              <IconButton icon="delete" onPress={() => removeAccount(a.id)} />
            )}
          />
        ))}
        <View style={{ paddingHorizontal: 16 }}>
          <Button icon="plus" onPress={() => setAccountOpen(true)}>
            {t('settings.addAccount')}
          </Button>
        </View>
      </List.Section>

      <Divider />

      {/* Categories */}
      <List.Section>
        <List.Subheader>{t('settings.categories')}</List.Subheader>
        {categories.map((c) => (
          <List.Item
            key={c.id}
            title={c.name}
            description={c.type}
            left={(p) => <List.Icon {...p} icon={c.icon ?? 'shape'} />}
            right={() => <IconButton icon="delete" onPress={() => removeCategory(c.id)} />}
          />
        ))}
        <View style={{ paddingHorizontal: 16 }}>
          <Button icon="plus" onPress={() => setCategoryOpen(true)}>
            {t('settings.addCategory')}
          </Button>
        </View>
      </List.Section>

      <Divider />

      {/* Data */}
      <List.Section>
        <List.Subheader>{t('settings.data')}</List.Subheader>
        <List.Item
          title={t('settings.exportDb')}
          description={t('settings.exportDbDesc')}
          left={(p) => <List.Icon {...p} icon="export" />}
          right={() => (
            <Button
              mode="contained-tonal"
              compact
              icon="google-drive"
              loading={exportingCsv}
              disabled={exportingCsv}
              onPress={handleExportCsv}>
              CSV
            </Button>
          )}
        />

      </List.Section>

      <Divider />

      {/* Screenshots */}
      <List.Section>
        <List.Subheader>{t('settings.screenshots')}</List.Subheader>
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {t('settings.deviceLabel')}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['phone', 'tablet7', 'tablet10'] as DeviceType[]).map((d) => (
              <Chip
                key={d}
                selected={selectedDevice === d}
                onPress={() => setSelectedDevice(d)}
                compact>
                {DEVICE_DIMENSIONS[d].label}
              </Chip>
            ))}
          </View>
          <Text variant="bodyMedium">{screenshotCountLabel}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button
              mode="contained"
              onPress={uploadAllToGoogleDrive}
              loading={isUploading}
              disabled={capturedScreenshots.length === 0 || isUploading}
              icon="google-drive"
              style={{ flex: 1 }}>
              {t('settings.uploadToDrive')}
            </Button>
            <Button
              mode="outlined"
              onPress={clearAllScreenshots}
              disabled={capturedScreenshots.length === 0}
              icon="delete">
              {t('settings.clear')}
            </Button>
          </View>
        </View>
      </List.Section>

      <View style={{ padding: 16 }}>
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
          {t('settings.version')}
        </Text>
      </View>

      <Portal>
        <Dialog visible={accountOpen} onDismiss={() => setAccountOpen(false)}>
          <Dialog.Title>{t('settings.newAccount')}</Dialog.Title>
          <Dialog.Content style={{ gap: 12 }}>
            <TextInput mode="outlined" label={t('settings.accountName')} value={accountName} onChangeText={setAccountName} />
            <TextInput
              mode="outlined"
              label={t('settings.accountCurrency')}
              value={accountCurrency}
              onChangeText={(v) => setAccountCurrency(v.toUpperCase())}
              autoCapitalize="characters"
              maxLength={3}
            />
            <SegmentedButtons
              value={accountType}
              onValueChange={(v) => setAccountType(v as AccountType)}
              buttons={[
                { value: 'cash', label: t('settings.accountTypeCash') },
                { value: 'bank', label: t('settings.accountTypeBank') },
                { value: 'card', label: t('settings.accountTypeCard') },
              ]}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setAccountOpen(false)}>{t('common.cancel')}</Button>
            <Button onPress={submitAccount}>{t('common.save')}</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={categoryOpen} onDismiss={() => setCategoryOpen(false)}>
          <Dialog.Title>{t('settings.newCategory')}</Dialog.Title>
          <Dialog.Content style={{ gap: 12 }}>
            <TextInput mode="outlined" label={t('settings.categoryName')} value={categoryName} onChangeText={setCategoryName} />
            <SegmentedButtons
              value={categoryType}
              onValueChange={(v) => setCategoryType(v as TransactionType)}
              buttons={[
                { value: 'EXPENSE', label: t('txn.types.EXPENSE') },
                { value: 'INCOME', label: t('txn.types.INCOME') },
              ]}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCategoryOpen(false)}>{t('common.cancel')}</Button>
            <Button onPress={submitCategory}>{t('common.save')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={exportSnackbar.visible}
        onDismiss={() => setExportSnackbar((s) => ({ ...s, visible: false }))}
        duration={exportSnackbar.error ? 6000 : 2500}
        action={{ label: t('common.ok'), onPress: () => setExportSnackbar((s) => ({ ...s, visible: false })) }}>
        {exportSnackbar.message}
      </Snackbar>
    </ScrollView>
  );
}
