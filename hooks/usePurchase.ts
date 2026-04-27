import type { IAPProductId } from '@/constants/iap';
import { useState } from 'react';

export interface PurchaseProduct {
  id: IAPProductId;
  title: string;
  displayPrice: string;
}

export function usePurchase() {
  const [isLoading] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isSupporter, setIsSupporter] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const purchase = async (_productId: IAPProductId) => {
    setIsPurchasing(true);
    setError(null);
    try {
      // Placeholder — wire up a real IAP library when available
      await Promise.resolve();
      setIsSupporter(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Purchase failed');
    } finally {
      setIsPurchasing(false);
    }
  };

  const restore = async () => {
    setError(null);
    try {
      await Promise.resolve();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Restore failed');
    }
  };

  return {
    products: [] as PurchaseProduct[],
    isLoading,
    isPurchasing,
    isSupporter,
    error,
    purchase,
    restore,
  };
}
