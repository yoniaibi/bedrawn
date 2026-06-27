import DrawDetailClient from './DrawDetailClient';
import { draws } from '@/lib/mockData';

export function generateStaticParams() {
  return draws.map(d => ({ id: d.id }));
}

export default function DrawDetailPage({ params }: { params: { id: string } }) {
  return <DrawDetailClient id={params.id} />;
}
