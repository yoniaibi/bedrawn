import PurchaseClient from './PurchaseClient';
import { draws } from '@/lib/mockData';

const PLAYWRIGHT_TEST_IDS = [
  '8df1fe4b-1109-4f21-afeb-1cf7eea6011d',
  'fa84542d-614a-4868-bcd5-886c40649df4',
];

export function generateStaticParams() {
  return [
    ...draws.map(d => ({ id: d.id })),
    ...PLAYWRIGHT_TEST_IDS.map(id => ({ id })),
  ];
}

export default async function PurchasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PurchaseClient id={id} />;
}
