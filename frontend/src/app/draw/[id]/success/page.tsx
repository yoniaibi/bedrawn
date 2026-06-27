import SuccessClient from './SuccessClient';
import { draws } from '@/lib/mockData';

export function generateStaticParams() {
  return draws.map(d => ({ id: d.id }));
}

export default async function SuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SuccessClient id={id} />;
}
