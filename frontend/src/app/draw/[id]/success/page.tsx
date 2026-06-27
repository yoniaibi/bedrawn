import SuccessClient from './SuccessClient';
import { draws } from '@/lib/mockData';

export function generateStaticParams() {
  return draws.map(d => ({ id: d.id }));
}

export default function SuccessPage({ params }: { params: { id: string } }) {
  return <SuccessClient id={params.id} />;
}
