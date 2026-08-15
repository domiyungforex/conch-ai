import { creatorIdeaCrud } from "@/modules/creator-ai/service";

export async function GET(req: Request, { params }: { params: Promise<{ creatorId: string }> }) {
  const { creatorId } = await params;
  return creatorIdeaCrud.list(req, creatorId);
}

export async function POST(req: Request, { params }: { params: Promise<{ creatorId: string }> }) {
  const { creatorId } = await params;
  return creatorIdeaCrud.create(req, creatorId);
}
