import { creatorCampaignCrud } from "@/modules/creator-ai/service";

export async function GET(req: Request, { params }: { params: Promise<{ creatorId: string }> }) {
  const { creatorId } = await params;
  return creatorCampaignCrud.list(req, creatorId);
}

export async function POST(req: Request, { params }: { params: Promise<{ creatorId: string }> }) {
  const { creatorId } = await params;
  return creatorCampaignCrud.create(req, creatorId);
}
