import { creatorCrud } from "@/modules/creator-ai/service";

export async function GET(req: Request, { params }: { params: Promise<{ creatorId: string }> }) {
  const { creatorId } = await params;
  return creatorCrud.getOne(req, creatorId);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ creatorId: string }> }) {
  const { creatorId } = await params;
  return creatorCrud.update(req, creatorId);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ creatorId: string }> }) {
  const { creatorId } = await params;
  return creatorCrud.remove(req, creatorId);
}
