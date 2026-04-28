import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  Button,
  Chip,
  Dialog,
  Divider,
  IconButton,
  List,
  Portal,
  Snackbar,
  Text,
  TextInput,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useExchangeRateStore } from '@/src/store/exchangeRateStore';
import { useAppTheme } from '@/src/theme';
import { ExchangeRate } from '@/src/types';

// ─── helpers ─────────────────────────────────────────────────────────────────

function pairKey(r: ExchangeRate) {
  return `${r.fromCode}→${r.toCode}`;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString();
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function FxRatesScreen() {
  const theme = useAppTheme();
  const { t } = useTranslation();

  const rates = useExchangeRateStore((s) => s.items);
  const upsertFxRate = useExchangeRateStore((s) => s.upsertRate);
  const deleteFxRate = useExchangeRateStore((s) => s.deleteRate);

  // Group all rates by pair, sorted by most-recent date desc within each group
  const grouped = useMemo(() => {
    const map = new Map<string, ExchangeRate[]>();
    for (const r of rates) {
      const k = pairKey(r);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(r);
    }
    // Sort within each pair: newest first
    for (const [, list] of map) {
      list.sort((a, b) => b.date - a.date);
    }
    // Sort pairs by latest rate date descending
    return Array.from(map.entries()).sort(([, a], [, b]) => b[0].date - a[0].date);
  }, [rates]);

  // Selected pair for history drill-down (null = show pair summary)
  const [selectedPair, setSelectedPair] = useState<string | null>(null);

  // Add rate dialog
  const [addOpen, setAddOpen] = useState(false);
  const [fxFrom, setFxFrom] = useState('EUR');
  const [fxTo, setFxTo] = useState('HUF');
  const [fxRate, setFxRate] = useState('');
  const [fxDate, setFxDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState('');

  const openAdd = useCallback((fromCode?: string, toCode?: string) => {
    if (fromCode) setFxFrom(fromCode);
    if (toCode) setFxTo(toCode);
    setFxRate('');
    setFxDate(new Date().toISOString().slice(0, 10));
    setAddOpen(true);
  }, []);

  const submitRate = async () => {
    const r = parseFloat(fxRate);
    if (!fxFrom.trim() || !fxTo.trim() || !Number.isFinite(r) || r <= 0) return;
    const dateMs = Date.parse(fxDate);
    if (isNaN(dateMs)) return;
    setSubmitting(true);
    try {
      await upsertFxRate({
        fromCode: fxFrom.trim().toUpperCase(),
        toCode: fxTo.trim().toUpperCase(),
        rate: String(r),
        source: 'manual',
        date: dateMs,
      });
      setAddOpen(false);
      setSnackbar(t('exchangeRates.form.titleAdd'));
    } finally {
      setSubmitting(false);
    }
  };

  const historyForPair = selectedPair
    ? (grouped.find(([k]) => k === selectedPair)?.[1] ?? [])
    : [];

  const [fromCode, toCode] = selectedPair ? selectedPair.split('→') : ['', ''];

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>

        {/* ── Pair selector chips ─────────────────────────────── */}
        {grouped.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 16, paddingBottom: 4 }}>
            <Chip
              selected={selectedPair === null}
              onPress={() => setSelectedPair(null)}
              compact>
              {t('reports.allCurrencies')}
            </Chip>
            {grouped.map(([key]) => (
              <Chip
                key={key}
                selected={selectedPair === key}
                onPress={() => setSelectedPair(selectedPair === key ? null : key)}
                compact>
                {key}
              </Chip>
            ))}
          </View>
        )}

        {/* ── History drill-down (single pair) ────────────────── */}
        {selectedPair !== null ? (
          <List.Section>
            <List.Subheader>{t('exchangeRates.pairHistory', { from: fromCode, to: toCode })}</List.Subheader>
            {historyForPair.length === 0 && (
              <List.Item
                title={t('exchangeRates.noHistory')}
                left={(p) => <List.Icon {...p} icon="information-outline" />}
              />
            )}
            {historyForPair.map((r) => (
              <List.Item
                key={r.id}
                title={r.rate}
                description={`${formatDate(r.date)}  ·  ${r.source}`}
                left={(p) => <List.Icon {...p} icon="currency-usd" />}
                right={() => (
                  <IconButton
                    icon="delete"
                    onPress={() => deleteFxRate(r.id)}
                  />
                )}
              />
            ))}
            <View style={{ paddingHorizontal: 16, paddingTop: 4 }}>
              <Button
                icon="plus"
                mode="contained-tonal"
                onPress={() => openAdd(fromCode, toCode)}>
                {t('exchangeRates.addRate')}
              </Button>
            </View>
          </List.Section>
        ) : (
          /* ── Pair summary (all pairs, latest rate per pair) ── */
          <List.Section>
            <List.Subheader>{t('exchangeRates.title')}</List.Subheader>
            {grouped.length === 0 && (
              <List.Item
                title={t('exchangeRates.noRates')}
                left={(p) => <List.Icon {...p} icon="information-outline" />}
              />
            )}
            {grouped.map(([key, list]) => {
              const latest = list[0];
              return (
                <React.Fragment key={key}>
                  <List.Item
                    title={key}
                    description={`${latest.rate}  ·  ${t('exchangeRates.lastUpdated', { date: formatDate(latest.date) })}`}
                    left={(p) => <List.Icon {...p} icon="swap-horizontal" />}
                    right={() => (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, alignSelf: 'center', marginRight: 4 }}>
                          {list.length}×
                        </Text>
                        <IconButton icon="history" onPress={() => setSelectedPair(key)} />
                      </View>
                    )}
                    onPress={() => setSelectedPair(key)}
                  />
                  <Divider />
                </React.Fragment>
              );
            })}
          </List.Section>
        )}
      </ScrollView>

      {/* ── Global add FAB-equivalent button ────────────────────── */}
      <View style={{ padding: 16, paddingBottom: 32 }}>
        <Button
          mode="contained"
          icon="plus"
          onPress={() => openAdd()}>
          {t('exchangeRates.addRate')}
        </Button>
      </View>

      {/* ── Add rate dialog ──────────────────────────────────────── */}
      <Portal>
        <Dialog visible={addOpen} onDismiss={() => setAddOpen(false)}>
          <Dialog.Title>{t('exchangeRates.form.titleAdd')}</Dialog.Title>
          <Dialog.Content style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                mode="outlined"
                label={t('exchangeRates.from')}
                value={fxFrom}
                onChangeText={(v) => setFxFrom(v.toUpperCase())}
                autoCapitalize="characters"
                maxLength={6}
                style={{ flex: 1 }}
              />
              <TextInput
                mode="outlined"
                label={t('exchangeRates.to')}
                value={fxTo}
                onChangeText={(v) => setFxTo(v.toUpperCase())}
                autoCapitalize="characters"
                maxLength={6}
                style={{ flex: 1 }}
              />
            </View>
            <TextInput
              mode="outlined"
              label={t('exchangeRates.rate')}
              value={fxRate}
              onChangeText={setFxRate}
              keyboardType="decimal-pad"
            />
            <TextInput
              mode="outlined"
              label={t('exchangeRates.date')}
              value={fxDate}
              onChangeText={setFxDate}
              placeholder="YYYY-MM-DD"
              keyboardType="numbers-and-punctuation"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setAddOpen(false)} disabled={submitting}>
              {t('common.cancel')}
            </Button>
            <Button
              onPress={submitRate}
              loading={submitting}
              disabled={submitting || !fxFrom || !fxTo || !fxRate || !fxDate}>
              {t('common.save')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={!!snackbar}
        onDismiss={() => setSnackbar('')}
        duration={2000}>
        {snackbar}
      </Snackbar>
    </View>
  );
}
