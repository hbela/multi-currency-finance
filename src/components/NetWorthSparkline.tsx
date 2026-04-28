import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../theme';
import { DailyNetWorthPoint } from '../db/transactions';

interface Props {
  data: DailyNetWorthPoint[];
  height?: number;
  width?: number;
}

const SPARKLINE_HEIGHT = 48;

export const NetWorthSparkline: React.FC<Props> = ({
  data,
  height = SPARKLINE_HEIGHT,
}) => {
  const theme = useAppTheme();

  if (data.length < 2) return null;

  const values = data.map((d) => d.amountBase);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  if (range === 0) return null;

  const last = values[values.length - 1];
  const first = values[0];
  const trending = last >= first;
  const lineColor = trending ? theme.colors.income : theme.colors.expense;

  // Normalise each value to 0..1
  const normalised = values.map((v) => (v - min) / range);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height, gap: 1 }}>
      {normalised.map((n, i) => {
        const barH = Math.max(2, Math.round(n * height));
        return (
          <View
            key={i}
            style={{
              flex: 1,
              height: barH,
              backgroundColor: lineColor,
              opacity: 0.4 + 0.6 * n,
              borderTopLeftRadius: 1,
              borderTopRightRadius: 1,
            }}
          />
        );
      })}
    </View>
  );
};

export const TrendBadge: React.FC<{ first: number; last: number }> = ({ first, last }) => {
  const theme = useAppTheme();
  if (first === 0) return null;
  const pct = Math.round(((last - first) / Math.abs(first)) * 100);
  const up = pct >= 0;
  return (
    <Text
      variant="labelSmall"
      style={{ color: up ? theme.colors.income : theme.colors.expense }}>
      {up ? '+' : ''}{pct}%
    </Text>
  );
};
