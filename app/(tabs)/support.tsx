import HeaderScreenshotButton from '@/src/components/ScreenshotCaptureButton';
import { IAP_AVAILABLE, IAP_PRODUCTS_FALLBACK, type IAPProductId } from '@/constants/iap';
import { Spacing } from '@/constants/theme';
import { usePurchase } from '@/hooks/usePurchase';
import { useTranslation } from '@/hooks/useTranslation';

import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
    Appbar,
    Button,
    Card,
    Divider,
    IconButton,
    Snackbar,
    Text,
    useTheme,
} from 'react-native-paper';

export default function SupportScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { t, _key } = useTranslation();

    // Force re-render when screen gains focus (handles language changes while screen was inactive)
    const [, forceUpdate] = useState(0);
    useFocusEffect(
        useCallback(() => {
            forceUpdate(n => n + 1);
        }, [_key]),
    );
    const {
        products,
        isLoading,
        isPurchasing,
        isSupporter,
        error,
        purchase,
        restore,
    } = usePurchase();

    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    /** Get display price from store products or localized fallback */
    const getProductDisplay = (productId: IAPProductId) => {
        const storeProduct = products.find((p) => p.id === productId);
        const fallback = IAP_PRODUCTS_FALLBACK[productId];

        const localizedTitleKey = {
            coffee_small: 'support.coffeeSmall',
            coffee_medium: 'support.coffeeMedium',
            coffee_large: 'support.coffeeLarge',
        } as const;

        return {
            title: storeProduct?.title ?? t(localizedTitleKey[productId]),
            price: storeProduct?.displayPrice ?? fallback.price,
            emoji: fallback.emoji,
        };
    };

    const handlePurchase = async (productId: IAPProductId) => {
        if (!IAP_AVAILABLE) {
            setSnackbarMessage(t('support.notAvailable'));
            setSnackbarVisible(true);
            return;
        }

        await purchase(productId);

        // If purchase succeeds, the hook sets isSupporter = true
        // We show the snackbar in the next render via useEffect-like check
        if (!error) {
            setSnackbarMessage(t('support.thankYouSnackbar'));
            setSnackbarVisible(true);
        }
    };

    const handleRestore = async () => {
        await restore();
        if (!error) {
            setSnackbarMessage(
                isSupporter
                    ? t('support.restoreSuccess')
                    : t('support.restoreNone'),
            );
            setSnackbarVisible(true);
        }
    };

    const small = getProductDisplay('coffee_small');
    const medium = getProductDisplay('coffee_medium');
    const large = getProductDisplay('coffee_large');

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]} key={_key}>
            <Appbar.Header elevated>
                <Appbar.BackAction onPress={() => router.back()} />
                <Appbar.Content title={t('support.title')} />
                <HeaderScreenshotButton screenName="support" />
            </Appbar.Header>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <IconButton
                        icon="coffee"
                        size={40}
                        iconColor={theme.colors.primary}
                    />
                </View>

                {/* Already Supported */}
                {isSupporter && (
                    <Card style={[styles.card, { backgroundColor: theme.colors.primaryContainer }]}>
                        <Card.Content style={styles.supporterContent}>
                            <Text
                                variant="titleMedium"
                                style={{ textAlign: 'center', color: theme.colors.onPrimaryContainer }}
                            >
                                {t('support.alreadySupported')}
                            </Text>
                        </Card.Content>
                    </Card>
                )}

                {/* Transparency Card */}
                <Card style={styles.card} mode="elevated">
                    <Card.Content>
                        <Text variant="bodyMedium" style={styles.paragraph}>
                            {t('support.transparencyIntro')}
                        </Text>
                        <Text variant="bodyMedium" style={styles.paragraph}>
                            {`\u2022 ${t('support.noAds')}\n\u2022 ${t('support.noTracking')}\n\u2022 ${t('support.noSubscriptions')}\n\u2022 ${t('support.noHiddenFees')}`}
                        </Text>
                        <Text variant="bodyMedium">
                            {t('support.supportMessage')}
                        </Text>
                    </Card.Content>
                </Card>

                {/* Coffee Options */}
                <Card style={styles.card} mode="elevated">
                    <Card.Content>
                        <Button
                            mode="contained"
                            style={styles.button}
                            onPress={() => handlePurchase('coffee_small')}
                            loading={isPurchasing}
                            disabled={isPurchasing || isLoading}
                        >
                            {`${small.emoji} ${small.title} \u2013 ${small.price}`}
                        </Button>

                        <Button
                            mode="contained-tonal"
                            style={styles.button}
                            onPress={() => handlePurchase('coffee_medium')}
                            loading={isPurchasing}
                            disabled={isPurchasing || isLoading}
                        >
                            {`${medium.emoji} ${medium.title} \u2013 ${medium.price}`}
                        </Button>

                        <Button
                            mode="outlined"
                            style={styles.button}
                            onPress={() => handlePurchase('coffee_large')}
                            loading={isPurchasing}
                            disabled={isPurchasing || isLoading}
                        >
                            {`${large.emoji} ${large.title} \u2013 ${large.price}`}
                        </Button>
                    </Card.Content>
                </Card>

                {/* Restore Purchases */}
                <Button
                    mode="text"
                    onPress={handleRestore}
                    disabled={isLoading}
                    style={styles.restoreButton}
                >
                    {t('support.restorePurchases')}
                </Button>

                {error && (
                    <Text
                        variant="bodySmall"
                        style={{ color: theme.colors.error, textAlign: 'center', marginTop: Spacing.sm }}
                    >
                        {error}
                    </Text>
                )}

                <Divider style={{ marginVertical: Spacing.xxl }} />

                {/* Thank You Section */}
                <View style={styles.thankYou}>
                    <Text variant="bodySmall" style={{ textAlign: 'center' }}>
                        {t('support.thankYouFooter')}
                    </Text>
                </View>
            </ScrollView>

            <Snackbar
                visible={snackbarVisible}
                onDismiss={() => setSnackbarVisible(false)}
                duration={3000}
            >
                {snackbarMessage}
            </Snackbar>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: Spacing.lg,
        paddingBottom: 80,
    },
    header: {
        alignItems: 'center',
        marginBottom: Spacing.xxl,
    },
    card: {
        marginBottom: Spacing.lg,
    },
    paragraph: {
        marginBottom: Spacing.md,
    },
    button: {
        marginBottom: Spacing.md,
    },
    restoreButton: {
        alignSelf: 'center',
    },
    supporterContent: {
        alignItems: 'center',
        paddingVertical: Spacing.sm,
    },
    thankYou: {
        alignItems: 'center',
    },
});
