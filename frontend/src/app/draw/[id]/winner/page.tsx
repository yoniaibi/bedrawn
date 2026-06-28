import { draws } from '@/lib/mockData';
import WinnerClient from './WinnerClient';

const PLAYWRIGHT_TEST_IDS = [
  '8df1fe4b-1109-4f21-afeb-1cf7eea6011d',
  'fa84542d-614a-4868-bcd5-886c40649df4',
];

export function generateStaticParams() {
  const fromMock = draws.map(d => ({ id: d.id }));
  const fromTests = PLAYWRIGHT_TEST_IDS.map(id => ({ id }));
  return [...fromMock, ...fromTests];
}

export default async function WinnerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WinnerClient id={id} />;
}
