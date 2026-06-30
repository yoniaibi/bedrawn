import SellerProfileClient from './SellerProfileClient';

// Static export requires this — seller IDs are dynamic UUIDs fetched client-side
export function generateStaticParams() {
  return [];
}

export default async function SellerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SellerProfileClient id={id} />;
}
