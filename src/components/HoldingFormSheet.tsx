import React, { useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import {
  Button,
  Dialog,
  Portal,
  TextInput,
  HelperText,
  Menu,
  Text,
  SegmentedButtons,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { useAssetStore } from '../store/assetStore';
import { useHoldingStore } from '../store/holdingStore';
import { useAccountStore } from '../store/accountStore';
import { HoldingWithAsset, AssetClass } from '../types';
import { useAppTheme } from '../theme';

// ─── Constants ────────────────────────────────────────────────────────────────

const ASSET_CLASSES: { value: AssetClass; label: string; icon: string }[] = [
  { value: 'stock',  label: 'Stock',  icon: 'trending-up' },
  { value: 'etf',    label: 'ETF',    icon: 'chart-bar' },
  { value: 'crypto', label: 'Crypto', icon: 'bitcoin' },
  { value: 'bond',   label: 'Bond',   icon: 'file-document-outline' },
  { value: 'other',  label: 'Other',  icon: 'dots-horizontal' },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  holding?: HoldingWithAsset;
  onDismiss: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HoldingFormSheet({ holding, onDismiss }: Props) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const assets = useAssetStore((s) => s.items);
  const { add: addAsset } = useAssetStore();
  const { add: addHolding, update: updateHolding, remove: removeHolding } = useHoldingStore();
  const accounts = useAccountStore((s) => s.items.filter((a) => a.isActive === 1));

  const isEdit = !!holding;

  // ── Holding fields ─────────────────────────────────────────────────────────
  const [selectedAssetId, setSelectedAssetId] = useState<string>(holding?.assetId ?? '');
  const [accountId, setAccountId] = useState<string>(holding?.accountId ?? '');
  const [quantity, setQuantity] = useState<string>(holding?.quantity ?? '');
  const [avgCost, setAvgCost] = useState<string>(holding?.avgCostBasis ?? '');
  const [currentPrice, setCurrentPrice] = useState<string>(holding?.currentValue ?? '');

  // ── New-asset inline creation ───────────────────────────────────────────────
  const [showNewAsset, setShowNewAsset] = useState(false);
  const [assetSymbol, setAssetSymbol] = useState('');
  const [assetName, setAssetName] = useState('');
  const [assetClass, setAssetClass] = useState<AssetClass>('stock');
  const [assetCurrency, setAssetCurrency] = useState('USD');
  const [assetExchange, setAssetExchange] = useState('');

  // ── Menus ──────────────────────────────────────────────────────────────────
  const [assetMenuOpen, setAssetMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  // ── Delete confirmation ────────────────────────────────────────────────────
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // ── Errors ─────────────────────────────────────────────────────────────────
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!selectedAssetId) e.asset = t('investments.form.errorAsset');
    if (!accountId) e.account = t('investments.form.errorAccount');
    if (!quantity || isNaN(parseFloat(quantity)) || parseFloat(quantity) <= 0)
      e.quantity = t('investments.form.errorQuantity');
    if (!avgCost || isNaN(parseFloat(avgCost)) || parseFloat(avgCost) < 0)
      e.avgCost = t('investments.form.errorAvgCost');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateNewAsset = (): boolean => {
    const e: Record<string, string> = {};
    if (!assetSymbol.trim()) e.assetSymbol = t('investments.form.errorSymbol');
    if (!assetName.trim()) e.assetName = t('investments.form.errorName');
    setErrors((prev) => ({ ...prev, ...e }));
    return !e.assetSymbol && !e.assetName;
  };

  const handleCreateAsset = async () => {
    if (!validateNewAsset()) return;
    const created = await addAsset({
      symbol: assetSymbol.trim().toUpperCase(),
      name: assetName.trim(),
      assetClass,
      currency: assetCurrency.trim().toUpperCase() || 'USD',
      exchange: assetExchange.trim() || null,
    });
    setSelectedAssetId(created.id);
    setShowNewAsset(false);
    setAssetSymbol('');
    setAssetName('');
    setAssetExchange('');
  };

  const handleSave = async () => {
    if (!validate()) return;
    const currentVal = currentPrice && parseFloat(currentPrice) > 0
      ? String(parseFloat(currentPrice) * parseFloat(quantity))
      : undefined;

    if (isEdit) {
      await updateHolding(holding.id, {
        quantity,
        avgCostBasis: avgCost,
      });
    } else {
      await addHolding({
        assetId: selectedAssetId,
        accountId,
        quantity,
        avgCostBasis: avgCost,
      });
    }
    onDismiss();
  };

  const handleDelete = async () => {
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
    await removeHolding(holding!.id);
    onDismiss();
  };

  const selectedAsset = assets.find((a) => a.id === selectedAssetId);
  const selectedAccount = accounts.find((a) => a.id === accountId);

  const unrealizedPnL = (() => {
    if (!selectedAsset || !avgCost || !quantity) return null;
    const price = currentPrice ? parseFloat(currentPrice) : parseFloat(avgCost);
    const qty = parseFloat(quantity);
    const cost = parseFloat(avgCost);
    if (isNaN(price) || isNaN(qty) || isNaN(cost)) return null;
    return (price - cost) * qty;
  })();

  return (
    <Portal>
      <Dialog visible onDismiss={onDismiss} style={{ maxHeight: '90%' }}>
        <Dialog.Title>
          {isEdit ? t('investments.form.titleEdit') : t('investments.form.titleAdd')}
        </Dialog.Title>
        <Dialog.ScrollArea style={{ paddingHorizontal: 0 }}>
          <ScrollView contentContainerStyle={styles.content}>

            {/* ── Asset picker ─────────────────────────────────────────── */}
            <Menu
              visible={assetMenuOpen}
              onDismiss={() => setAssetMenuOpen(false)}
              anchor={
                <TextInput
                  mode="outlined"
                  label={t('investments.fields.asset')}
                  value={selectedAsset ? `${selectedAsset.symbol} — ${selectedAsset.name}` : ''}
                  onFocus={() => setAssetMenuOpen(true)}
                  showSoftInputOnFocus={false}
                  right={<TextInput.Icon icon="chevron-down" onPress={() => setAssetMenuOpen(true)} />}
                  error={!!errors.asset}
                />
              }
            >
              {assets.map((a) => (
                <Menu.Item
                  key={a.id}
                  title={`${a.symbol} — ${a.name}`}
                  leadingIcon={selectedAssetId === a.id ? 'check' : undefined}
                  onPress={() => { setSelectedAssetId(a.id); setAssetMenuOpen(false); }}
                />
              ))}
              <Menu.Item
                title={t('investments.form.titleAddAsset')}
                leadingIcon="plus"
                onPress={() => { setAssetMenuOpen(false); setShowNewAsset(true); }}
              />
            </Menu>
            {errors.asset ? <HelperText type="error">{errors.asset}</HelperText> : null}

            {/* ── Inline new-asset form ────────────────────────────────── */}
            {showNewAsset && (
              <View style={[styles.newAssetBox, { borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surfaceVariant }]}>
                <Text variant="labelLarge" style={{ marginBottom: 8 }}>{t('investments.form.titleAddAsset')}</Text>
                <TextInput
                  mode="outlined"
                  label={t('investments.fields.symbol')}
                  value={assetSymbol}
                  onChangeText={setAssetSymbol}
                  autoCapitalize="characters"
                  error={!!errors.assetSymbol}
                />
                {errors.assetSymbol ? <HelperText type="error">{errors.assetSymbol}</HelperText> : null}
                <View style={{ height: 8 }} />
                <TextInput
                  mode="outlined"
                  label={t('investments.fields.name')}
                  value={assetName}
                  onChangeText={setAssetName}
                  error={!!errors.assetName}
                />
                {errors.assetName ? <HelperText type="error">{errors.assetName}</HelperText> : null}
                <View style={{ height: 8 }} />
                <Text variant="labelMedium" style={{ marginBottom: 4 }}>{t('investments.fields.assetClass')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <SegmentedButtons
                    value={assetClass}
                    onValueChange={(v) => setAssetClass(v as AssetClass)}
                    buttons={ASSET_CLASSES.map((c) => ({ value: c.value, label: c.label, icon: c.icon }))}
                  />
                </ScrollView>
                <View style={{ height: 8 }} />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    mode="outlined"
                    label={t('investments.fields.currency')}
                    value={assetCurrency}
                    onChangeText={setAssetCurrency}
                    autoCapitalize="characters"
                    style={{ flex: 1 }}
                  />
                  <TextInput
                    mode="outlined"
                    label={t('investments.fields.exchange')}
                    value={assetExchange}
                    onChangeText={setAssetExchange}
                    style={{ flex: 2 }}
                  />
                </View>
                <View style={{ height: 8 }} />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Button mode="outlined" onPress={() => setShowNewAsset(false)} style={{ flex: 1 }}>
                    {t('common.cancel')}
                  </Button>
                  <Button mode="contained" onPress={handleCreateAsset} style={{ flex: 1 }}>
                    {t('common.save')}
                  </Button>
                </View>
              </View>
            )}

            {/* ── Account picker ───────────────────────────────────────── */}
            <Menu
              visible={accountMenuOpen}
              onDismiss={() => setAccountMenuOpen(false)}
              anchor={
                <TextInput
                  mode="outlined"
                  label={t('investments.fields.account')}
                  value={selectedAccount ? `${selectedAccount.name} · ${selectedAccount.currency}` : ''}
                  onFocus={() => setAccountMenuOpen(true)}
                  showSoftInputOnFocus={false}
                  right={<TextInput.Icon icon="chevron-down" onPress={() => setAccountMenuOpen(true)} />}
                  error={!!errors.account}
                />
              }
            >
              {accounts.map((a) => (
                <Menu.Item
                  key={a.id}
                  title={`${a.name} · ${a.currency}`}
                  leadingIcon={accountId === a.id ? 'check' : undefined}
                  onPress={() => { setAccountId(a.id); setAccountMenuOpen(false); }}
                />
              ))}
            </Menu>
            {errors.account ? <HelperText type="error">{errors.account}</HelperText> : null}

            {/* ── Quantity ──────────────────────────────────────────────── */}
            <TextInput
              mode="outlined"
              label={t('investments.fields.quantity')}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="decimal-pad"
              error={!!errors.quantity}
            />
            {errors.quantity ? <HelperText type="error">{errors.quantity}</HelperText> : null}

            {/* ── Avg cost ──────────────────────────────────────────────── */}
            <TextInput
              mode="outlined"
              label={t('investments.fields.avgCost')}
              value={avgCost}
              onChangeText={setAvgCost}
              keyboardType="decimal-pad"
              error={!!errors.avgCost}
            />
            {errors.avgCost ? <HelperText type="error">{errors.avgCost}</HelperText> : null}

            {/* ── Current price (optional, for P&L preview) ─────────────── */}
            <TextInput
              mode="outlined"
              label={t('investments.fields.currentPrice')}
              value={currentPrice}
              onChangeText={setCurrentPrice}
              keyboardType="decimal-pad"
              right={<TextInput.Affix text={selectedAsset?.currency ?? ''} />}
            />
            <HelperText type="info">{t('investments.currentPriceHint')}</HelperText>

            {/* ── P&L preview ───────────────────────────────────────────── */}
            {unrealizedPnL !== null && (
              <View style={[styles.pnlRow, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  {t('investments.unrealizedPnL')}
                </Text>
                <Text
                  variant="labelLarge"
                  style={{ color: unrealizedPnL >= 0 ? theme.colors.primary : theme.colors.error }}
                >
                  {unrealizedPnL >= 0 ? '+' : ''}
                  {unrealizedPnL.toFixed(2)} {selectedAsset?.currency ?? ''}
                </Text>
              </View>
            )}
          </ScrollView>
        </Dialog.ScrollArea>

        <Dialog.Actions style={{ flexDirection: 'column', gap: 4 }}>
          {isEdit && (
            <Button
              mode="text"
              textColor={theme.colors.error}
              onPress={handleDelete}
              style={{ alignSelf: 'stretch' }}
            >
              {deleteConfirm ? t('investments.form.confirmDelete') : t('common.delete')}
            </Button>
          )}
          <View style={{ flexDirection: 'row', gap: 8, alignSelf: 'stretch' }}>
            <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }}>
              {t('common.cancel')}
            </Button>
            <Button mode="contained" onPress={handleSave} style={{ flex: 1 }}>
              {t('common.save')}
            </Button>
          </View>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  newAssetBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  pnlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 8,
    padding: 12,
  },
});
