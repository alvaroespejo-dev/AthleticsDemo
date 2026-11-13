import { useQuery } from '@tanstack/react-query'
import { settings } from '@/api/endpoints'
import { DEFAULT_CURRENCY, setCurrencyCode } from '@/lib/format'

/**
 * Currency code of the organization (Settings.CurrencyCode, USD by default). Labels that show the currency
 * take it as the `currency` interpolation value: t('operation.amount', { currency }).
 * The value is applied during render, so formatMoney uses it on the same pass.
 */
export function useCurrencyCode(): string {
  const query = useQuery({ queryKey: ['settings'], queryFn: () => settings.get(), staleTime: 5 * 60_000 })
  const code = query.data?.currencyCode ?? DEFAULT_CURRENCY
  setCurrencyCode(code)

  return code
}
