import { permanentRedirect } from 'next/navigation';

type PageProps = {
    params: Promise<{ locale: string; path?: string[] }>;
};

// Legacy /[locale]/m/* redirect to /[locale]/moments/*
export default async function LegacyMomentRedirect({ params }: PageProps) {
    const { locale, path } = await params;
    const subPath = path?.join('/') || '';
    const basePath = locale === 'en' ? '' : `/${locale}`;
    permanentRedirect(subPath ? `${basePath}/moments/${subPath}` : `${basePath}/moments`);
}
