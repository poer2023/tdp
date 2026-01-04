import { permanentRedirect } from 'next/navigation';

type PageProps = {
    params: Promise<{ path?: string[] }>;
};

// Legacy /m/* redirect to /moments/*
export default async function LegacyMomentRedirect({ params }: PageProps) {
    const { path } = await params;
    const subPath = path?.join('/') || '';
    permanentRedirect(subPath ? `/moments/${subPath}` : '/moments');
}
