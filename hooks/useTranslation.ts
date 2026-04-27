import { useTranslation as useI18nTranslation } from 'react-i18next';

/** Thin wrapper that adds `_key` — a stable string that changes on every language
 *  switch — so screens can use it as a `key` prop to force a full re-render. */
export function useTranslation() {
  const result = useI18nTranslation();
  return { ...result, _key: result.i18n.language };
}
