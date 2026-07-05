import DrawDetailClient from './DrawDetailClient';

const FALLBACK_IDS = ['1', '2', '3', '4', '5'];

export async function generateStaticParams() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/draws`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const fromApi = (data.draws ?? []).map((d: { id: string }) => ({ id: d.id }));
      const fromFallback = FALLBACK_IDS.map(id => ({ id }));
      return [...fromApi, ...fromFallback];
    }
  } catch {}
  return FALLBACK_IDS.map(id => ({ id }));
}

export default async function DrawDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DrawDetailClient id={id} />;
}
