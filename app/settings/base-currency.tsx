import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  Button,
  Card,
  Dialog,
  Divider,
  List,
  Portal,
  RadioButton,
  Snackbar,
  Text,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useCurrencyStore } from '@/src/store/currencyStore';
import { useAppTheme } from '@/src/theme';

export default function BaseCurrencyScreen() {
  const theme = useAppTheme();
  const { t } = useTranslation();

  const currencies = useCurrencyStore((s) => s.items);
  const base = useCurrencyStore((s) => s.base);
  const setBase = useCurrencyStore((s) => s.setBase);

  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState('');

  const confirmChange = async () => {
    if (!pendingCode) return;
    setSaving(true);
    try {
      await setBase(pendingCode);
      setSnackbar(t('baseCurrency.changed', { code: pendingCode }));
    } finally {
      setSaving(false);
      setPendingCode(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>

        {/* Current base info card */}
        <Card mode="elevated" style={{ margin: 16 }}>
          <Card.Content style={{ gap: 4 }}>
            <Text variant="titleMedium">
              {t('baseCurrency.current', { code: base?.code ?? '—' })}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {base?.name ?? ''}
            </Text>
          </Card.Content>
        </Card>

        {/* Warning banner */}
        <Card
          mode="outlined"
          style={{ marginHorizontal: 16, marginBottom: 16, borderColor: theme.colors.outline }}>
          <Card.Content style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <List.Icon icon="alert-outline" color={theme.colors.onSurfaceVariant} style={{ margin: 0 }} />
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}>
              {t('baseCurrency.warning')}
            </Text>
          </Card.Content>
        </Card>

        <Divider />

        {/* Currency list with radio buttons */}
        <List.Section>
          <List.Subheader>{t('baseCurrency.title')}</List.Subheader>
          <RadioButton.Group
            value={base?.code ?? ''}
            onValueChange={(code) => {
              if (code !== base?.code) setPendingCode(code);
            }}>
            {currencies.map((c) => (
              <React.Fragment key={c.code}>
                <List.Item
                  title={`${c.code}  ${c.symbol}`}
                  description={c.name}
                  onPress={() => {
                    if (c.code !== base?.code) setPendingCode(c.code);
                  }}
                  left={() => (
                    <RadioButton.Android
                      value={c.code}
                      status={c.code === (base?.code ?? '') ? 'checked' : 'unchecked'}
                      onPress={() => {
                        if (c.code !== base?.code) setPendingCode(c.code);
                      }}
                    />
                  )}
                />
                <Divider />
              </React.Fragment>
            ))}
          </RadioButton.Group>
        </List.Section>
      </ScrollView>

      {/* Confirm change dialog */}
      <Portal>
        <Dialog visible={pendingCode !== null} onDismiss={() => setPendingCode(null)}>
          <Dialog.Title>{t('baseCurrency.title')}</Dialog.Title>
          <Dialog.Content style={{ gap: 12 }}>
            <Text variant="bodyMedium">
              {t('baseCurrency.confirm', { code: pendingCode ?? '' })}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('baseCurrency.warning')}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPendingCode(null)} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button
              onPress={confirmChange}
              loading={saving}
              disabled={saving}
              mode="contained">
              {t('baseCurrency.changeTo', { code: pendingCode ?? '' })}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={!!snackbar}
        onDismiss={() => setSnackbar('')}
        duration={2500}>
        {snackbar}
      </Snackbar>
    </View>
  );
}
