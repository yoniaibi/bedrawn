import SellerProfileClient from './SellerProfileClient';

export default async function SellerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SellerProfileClient id={id} />;
}
