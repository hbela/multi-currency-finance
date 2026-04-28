import React, { useMemo, useState } from 'react';
import { SectionList, View, StyleSheet } from 'react-native';
import { FAB, Text, Surface, Divider, IconButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useHoldingStore } from '@/src/store/holdingStore';
import { useAccountStore } from '@/src/store/accountStore';
import { useCurrencyStore } from '@/src/store/currencyStore';
import HoldingFormSheet from '@/src/components/HoldingFormSheet';
import { HoldingWithAsset, AssetClass } from '@/src/types';
import { useAppTheme } from '@/src/theme';
import { useMoneyFormatter } from '@/src/hooks/useFormattedAmount';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CLASS_ICON: Record<AssetClass, string> = {
  stock:  'trending-up',
  etf:    'chart-bar',
  crypto: 'bitcoin',
  bond:   'file-document-outline',
  other:  'dots-horizontal',
};

const CLASS_ORDER: AssetClass[] = ['stock', 'etf', 'crypto', 'bond', 'other'];

interface HoldingRow extends HoldingWithAsset {
  currentValue: string;
  unrealizedPnL: string;
}

// ─── Row ─────────────────────────────────────────────────────────────────────

interface RowProps {
  item: HoldingRow;
  onPress: () => void;
  accountName: string;
}

const HoldingListRow: React.FC<RowProps> = ({ item, onPress, accountName }) => {
  const theme = useAppTheme();
  const fmt = useMoneyFormatter(item.asset.currency);
  const pnl = parseFloat(item.unrealizedPnL);
  const pnlColor = pnl >= 0 ? theme.colors.primary : theme.colors.error;

  return (
    <Surface
      style={[styles.row, { backgroundColor: theme.colors.elevation.level1 }]}
      elevation={0}
    >
      <View style={styles.rowLeft}>
        <View style={[styles.classChip, { backgroundColor: theme.colors.primaryContainer }]}>
          <MaterialCommunityIcons
            name={CLASS_ICON[item.asset.assetClass] as any}
            size={14}
            color={theme.colors.onPrimaryContainer}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="titleSmall" numberOfLines={1}>{item.asset.symbol}</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={1}>
            {item.asset.name} · {accountName}
          </Text>
        </View>
      </View>
      <View style={styles.rowRight}>
        <Text variant="titleSmall">{fmt(parseFloat(item.currentValue))}</Text>
        <Text variant="bodySmall" style={{ color: pnlColor }}>
          {pnl >= 0 ? '+' : ''}{fmt(pnl)}
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {item.quantity} units
        </Text>
      </View>
      <IconButton icon="pencil-outline" size={18} onPress={onPress} />
    </Surface>
  );
};

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function InvestmentsScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const holdings = useHoldingStore((s) => s.items);
  const accounts = useAccountStore((s) => s.items);
  const base = useCurrencyStore((s) => s.base);

  const [formVisible, setFormVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<HoldingWithAsset | undefined>();

  // Enrich holdings with currentValue / unrealisedPnL
  const enriched: HoldingRow[] = useMemo(
    () =>
      holdings.map((h) => {
        const qty = parseFloat(h.quantity);
        const cost = parseFloat(h.avgCostBasis);
        // Use currentValue if stored, else fall back to cost basis
        const price = h.currentValue ? parseFloat(h.currentValue) / (qty || 1) : cost;
        const value = price * qty;
        const pnl = (price - cost) * qty;
        return {
          ...h,
          currentValue: String(Math.round(value * 1e6) / 1e6),
          unrealizedPnL: String(Math.round(pnl * 1e6) / 1e6),
        };
      }),
    [holdings]
  );

  // Group by asset class in CLASS_ORDER
  const sections = useMemo(() => {
    return CLASS_ORDER
      .map((cls) => ({
        title: cls,
        data: enriched.filter((h) => h.asset.assetClass === cls),
      }))
      .filter((s) => s.data.length > 0);
  }, [enriched]);

  // Totals
  const totalValue = useMemo(
    () => enriched.reduce((s, h) => s + parseFloat(h.currentValue), 0),
    [enriched]
  );
  const totalPnL = useMemo(
    () => enriched.reduce((s, h) => s + parseFloat(h.unrealizedPnL), 0),
    [enriched]
  );

  const fmtBase = useMoneyFormatter(base?.code ?? 'USD');
  const pnlColor = totalPnL >= 0 ? theme.colors.primary : theme.colors.error;

  const openAdd = () => { setEditTarget(undefined); setFormVisible(true); };
  const openEdit = (h: HoldingWithAsset) => { setEditTarget(h); setFormVisible(true); };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>

      {/* ── Summary card ──────────────────────────────────────────────── */}
      <Surface style={[styles.summary, { backgroundColor: theme.colors.elevation.level2 }]} elevation={1}>
        <View style={styles.summaryItem}>
          <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {t('investments.totalValue')}
          </Text>
          <Text variant="headlineSmall">{fmtBase(totalValue)}</Text>
        </View>
        <Divider style={{ width: 1, height: '100%' }} />
        <View style={styles.summaryItem}>
          <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {t('investments.unrealizedPnL')}
          </Text>
          <Text variant="headlineSmall" style={{ color: pnlColor }}>
            {totalPnL >= 0 ? '+' : ''}{fmtBase(totalPnL)}
          </Text>
        </View>
      </Surface>

      {/* ── List ──────────────────────────────────────────────────────── */}
      {sections.length === 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="chart-line" size={48} color={theme.colors.outlineVariant} />
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant, marginTop: 12, textAlign: 'center' }}
          >
            {t('investments.noHoldings')}
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 96 }}
          renderSectionHeader={({ section }) => (
            <View style={[styles.sectionHeader, { backgroundColor: theme.colors.background }]}>
              <MaterialCommunityIcons
                name={CLASS_ICON[section.title as AssetClass] as any}
                size={16}
                color={theme.colors.primary}
              />
              <Text
                variant="labelLarge"
                style={{ color: theme.colors.primary, marginLeft: 6 }}
              >
                {t(`investments.classes.${section.title as AssetClass}`)}
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <HoldingListRow
              item={item}
              onPress={() => openEdit(item)}
              accountName={accounts.find((a) => a.id === item.accountId)?.name ?? '—'}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
        />
      )}

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primaryContainer }]}
        color={theme.colors.onPrimaryContainer}
        onPress={openAdd}
      />

      {formVisible && (
        <HoldingFormSheet
          holding={editTarget}
          onDismiss={() => setFormVisible(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  summary: {
    flexDirection: 'row',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  summaryItem: { flex: 1, alignItems: 'center', gap: 4 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  rowLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowRight: { alignItems: 'flex-end', gap: 2 },
  classChip: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  fab: { position: 'absolute', right: 16, bottom: 24 },
});
