import PostalEntryClient from './PostalEntryClient';

const FALLBACK_IDS = ['1', '2', '3', '4', '5'];

export async function generateStaticParams() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/draws`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const fromApi = (data.draws ?? []).map((d: { id: string }) => ({ id: d.id }));
      return [...fromApi, ...FALLBACK_IDS.map(id => ({ id }))];
    }
  } catch {}
  return FALLBACK_IDS.map(id => ({ id }));
}

export default function PostalEntryPage({ params }: { params: { id: string } }) {
  return <PostalEntryClient params={params} />;
}
