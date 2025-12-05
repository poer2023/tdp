"use client";

import { useSettings } from './store';
import { adminTranslations, type AdminLocale } from '@/lib/admin-translations';

/**
 * Hook to get admin locale and translation function
 */
export function useAdminLocale() {
    const { language } = useSettings();
    const locale: AdminLocale = language === 'zh' ? 'zh' : 'en';

    const t = (key: keyof typeof adminTranslations.en): string => {
        return adminTranslations[locale][key];
    };

    return { locale, t };
}

export type { AdminLocale };

