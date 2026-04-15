'use server';

import {mutate} from '@/lib/vendure/api';
import {RequestPasswordResetMutation} from '@/lib/vendure/mutations';
import {getTranslations} from 'next-intl/server';

export async function requestPasswordResetAction(prevState: { error?: string; success?: boolean } | undefined, formData: FormData) {
    const t = await getTranslations('Errors');
    const emailAddress = formData.get('emailAddress') as string;

    if (!emailAddress) {
        return {error: t('emailRequired')};
    }

    try {
        const result = await mutate(RequestPasswordResetMutation, {
            emailAddress,
        });

        const resetResult = result.data.requestPasswordReset;

        if (resetResult?.__typename !== 'Success') {
            return {error: resetResult?.message || t('failedPasswordReset')};
        }

        return {success: true};
    } catch {
        return {error: t('unexpectedError')};
    }
}
