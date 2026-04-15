'use server';

import {mutate} from '@/lib/vendure/api';
import {ResetPasswordMutation} from '@/lib/vendure/mutations';
import {setAuthToken} from '@/lib/auth';
import {redirect} from '@/i18n/navigation';
import {getLocale, getTranslations} from 'next-intl/server';

export async function resetPasswordAction(prevState: { error?: string } | undefined, formData: FormData) {
    const t = await getTranslations('Errors');
    const token = formData.get('token') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!token || !password || !confirmPassword) {
        return {error: t('fieldsRequired')};
    }

    if (password !== confirmPassword) {
        return {error: t('passwordsMismatch')};
    }


    const result = await mutate(ResetPasswordMutation, {
        token,
        password,
    });

    const resetResult = result.data.resetPassword;

    if (resetResult.__typename !== 'CurrentUser') {
        return {error: resetResult.message};
    }

    // Store the token in a cookie if returned
    if (result.token) {
        await setAuthToken(result.token);
    }

    const locale = await getLocale();
    redirect({href: '/', locale});
}
