export type IAPProductId = 'coffee_small' | 'coffee_medium' | 'coffee_large';

/** Set to true once a real IAP package (e.g. expo-iap) is installed. */
export const IAP_AVAILABLE = false;

export const IAP_PRODUCTS_FALLBACK: Record<IAPProductId, { price: string; emoji: string }> = {
  coffee_small:  { price: '$0.99',  emoji: '☕' },
  coffee_medium: { price: '$1.99',  emoji: '☕☕' },
  coffee_large:  { price: '$4.99',  emoji: '☕☕☕' },
};
