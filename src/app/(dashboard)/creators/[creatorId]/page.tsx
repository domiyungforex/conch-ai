import { CreatorDetailClient } from "./CreatorDetailClient";

export default async function CreatorDetailPage({ params }: { params: Promise<{ creatorId: string }> }) {
  const { creatorId } = await params;
  return <CreatorDetailClient creatorId={creatorId} />;
}
