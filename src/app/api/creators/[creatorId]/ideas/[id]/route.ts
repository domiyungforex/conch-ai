import { creatorIdeaCrud } from "@/modules/creator-ai/service";

export async function GET(req: Request, { params }: { params: Promise<{ creatorId: string; id: string }> }) {
  const { creatorId, id } = await params;
  return creatorIdeaCrud.getOne(req, creatorId, id);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ creatorId: string; id: string }> }) {
  const { creatorId, id } = await params;
  return creatorIdeaCrud.update(req, creatorId, id);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ creatorId: string; id: string }> }) {
  const { creatorId, id } = await params;
  return creatorIdeaCrud.remove(req, creatorId, id);
}
