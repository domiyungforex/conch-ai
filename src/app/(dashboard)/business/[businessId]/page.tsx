import { BusinessDetailClient } from "./BusinessDetailClient";

export default async function BusinessDetailPage({ params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  return <BusinessDetailClient businessId={businessId} />;
}
