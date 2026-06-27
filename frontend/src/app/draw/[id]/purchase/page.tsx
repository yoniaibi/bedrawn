import PurchaseClient from './PurchaseClient';
import { draws } from '@/lib/mockData';

export function generateStaticParams() {
  return draws.map(d => ({ id: d.id }));
}

export default function PurchasePage({ params }: { params: { id: string } }) {
  return <PurchaseClient id={params.id} />;
}
