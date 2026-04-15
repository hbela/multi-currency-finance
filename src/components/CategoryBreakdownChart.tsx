import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';

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
  const byId = useCategoryStore((s) => s.byId);
  const total = rows.reduce((acc, r) => acc + r.total, 0);
  const max = rows.reduce((acc, r) => Math.max(acc, r.total), 0);

  const palette = [
    theme.colors.primary,
    theme.colors.tertiary,
    theme.colors.secondary,
    theme.colors.income,
    theme.colors.warning,
    theme.colors.expense,
  ];

  if (rows.length === 0) {
    return (
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
        No categories to display.
      </Text>
    );
  }

  return (
    <View style={{ gap: 12 }}>
      {rows.map((r, i) => {
        const cat = byId(r.category_id);
        const fill = max > 0 ? r.total / max : 0;
        const share = total > 0 ? (r.total / total) * 100 : 0;
        const color = palette[i % palette.length];
        return (
          <View key={r.category_id ?? 'uncategorized'} style={{ gap: 4 }}>
            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
              <Text variant="bodyMedium" numberOfLines={1} style={{ flex: 1 }}>
                {cat?.name ?? 'Uncategorized'}
              </Text>
              <Text variant="bodyMedium">{formatCurrency(r.total, currency)}</Text>
            </View>
            <View
              style={{
                height: 8,
                borderRadius: 4,
                backgroundColor: theme.colors.surfaceVariant,
                overflow: 'hidden',
              }}>
              <View
                style={{
                  width: `${Math.max(fill * 100, fill > 0 ? 2 : 0)}%`,
                  height: 8,
                  backgroundColor: color,
                }}
              />
            </View>
            <Text
              variant="labelSmall"
              style={{ color: theme.colors.onSurfaceVariant, textAlign: 'right' }}>
              {share.toFixed(0)}%
            </Text>
          </View>
        );
      })}
    </View>
  );
};
