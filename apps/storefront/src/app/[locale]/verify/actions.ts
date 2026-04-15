'use server';

import {mutate} from '@/lib/vendure/api';
import {VerifyCustomerAccountMutation} from '@/lib/vendure/mutations';
import {setAuthToken} from '@/lib/auth';
import {getTranslations} from 'next-intl/server';

export async function verifyAccountAction(token: string, password?: string) {
    const t = await getTranslations('Errors');

    if (!token) {
        return {error: t('verificationTokenRequired')};
    }

    try {
        const result = await mutate(VerifyCustomerAccountMutation, {
            token,
            password: password || undefined,
        });

        const verifyResult = result.data.verifyCustomerAccount;

        if (verifyResult.__typename !== 'CurrentUser') {
            return {error: verifyResult.message};
        }

        // Store the token in a cookie if returned
        if (result.token) {
            await setAuthToken(result.token);
        }

        return {success: true};
    } catch {
        return {error: t('unexpectedError')};
    }
}
