import DrawDetailClient from './DrawDetailClient';
import { draws } from '@/lib/mockData';

export function generateStaticParams() {
  return draws.map(d => ({ id: d.id }));
}

export default async function DrawDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DrawDetailClient id={id} />;
}
