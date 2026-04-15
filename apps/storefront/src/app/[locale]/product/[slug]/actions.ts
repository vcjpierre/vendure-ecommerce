'use server';

import { mutate } from '@/lib/vendure/api';
import { AddToCartMutation } from '@/lib/vendure/mutations';
import { updateTag } from 'next/cache';
import { setAuthToken } from '@/lib/auth';
import { getActiveCurrencyCode } from '@/lib/currency-server';
import { getLocale, getTranslations } from 'next-intl/server';

export async function addToCart(variantId: string, quantity: number = 1) {
  const locale = await getLocale();
  const currencyCode = await getActiveCurrencyCode();
  const t = await getTranslations({locale, namespace: 'Errors'});

  try {
    const result = await mutate(AddToCartMutation, { variantId, quantity }, { useAuthToken: true, currencyCode });

    if (result.token) {
      await setAuthToken(result.token);
    }

    if (result.data.addItemToOrder.__typename === 'Order') {
      // Revalidate cart data across all pages
      updateTag('cart');
      updateTag('active-order');
      return { success: true, order: result.data.addItemToOrder };
    } else {
      return { success: false, error: result.data.addItemToOrder.message };
    }
  } catch {
    return { success: false, error: t('failedAddToCart') };
  }
}
