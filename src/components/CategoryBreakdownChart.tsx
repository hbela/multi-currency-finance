import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { CategoryBreakdownRow } from '../db/transactions';
import { useCategoryStore } from '../store/categoryStore';
import { useAppTheme } from '../theme';
import { formatCurrency } from '../utils/format';

interface Props {
  rows: CategoryBreakdownRow[];
  currency?: string;
}

export const CategoryBreakdownChart: React.FC<Props> = ({ rows, currency = 'USD' }) => {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const byId = useCategoryStore((s) => s.byId);
  const total = rows.reduce((acc, r) => acc + r.total, 0);
  const max = rows.reduce((acc, r) => Math.max(acc, r.total), 0);
  const palette = [
    theme.colors.primary,
    theme.colors.income,
    theme.colors.tertiary,
    theme.colors.secondary,
    theme.colors.warning,
    theme.colors.expense,
  ];

  if (rows.length === 0) {
    return (
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
        {t('reports.noCategories')}
      </Text>
    );
  }

  return (
    <View style={{ gap: 16 }}>
      {/* Segmented progress bar as a stand-in "donut" — simple, no lib needed */}
      <View style={{ alignItems: 'center', gap: 8 }}>
        <View style={{ flexDirection: 'row', height: 16, borderRadius: 8, overflow: 'hidden', width: '100%' }}>
          {rows.map((r, i) => {
            const share = total > 0 ? r.total / total : 0;
            if (share === 0) return null;
            return (
              <View
                key={r.category_id ?? i}
                style={{ flex: share, backgroundColor: palette[i % palette.length] }}
              />
            );
          })}
        </View>
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {formatCurrency(total, currency)}
        </Text>
      </View>

      {/* Rows */}
      <View style={{ gap: 10 }}>
        {rows.map((r, i) => {
          const cat = byId(r.category_id);
          const fill = max > 0 ? r.total / max : 0;
          const share = total > 0 ? (r.total / total) * 100 : 0;
          const color = palette[i % palette.length];
          return (
            <View key={r.category_id ?? 'uncategorized'} style={{ gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color, flexShrink: 0 }}
                />
                <Text variant="bodyMedium" numberOfLines={1} style={{ flex: 1 }}>
                  {cat?.name ?? 'Uncategorized'}
                </Text>
                <Text
                  variant="labelSmall"
                  style={{ color: theme.colors.onSurfaceVariant, marginRight: 4 }}>
                  {share.toFixed(0)}%
                </Text>
                <Text variant="bodyMedium" style={{ minWidth: 88, textAlign: 'right' }}>
                  {formatCurrency(r.total, currency)}
                </Text>
              </View>
              <View
                style={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: theme.colors.surfaceVariant,
                  overflow: 'hidden',
                }}>
                <View
                  style={{
                    width: `${Math.max(fill * 100, fill > 0 ? 2 : 0)}%`,
                    height: 6,
                    backgroundColor: color,
                    borderRadius: 3,
                  }}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};
