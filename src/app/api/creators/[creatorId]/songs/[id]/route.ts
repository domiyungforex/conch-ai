import { creatorSongCrud } from "@/modules/creator-ai/service";

export async function GET(req: Request, { params }: { params: Promise<{ creatorId: string; id: string }> }) {
  const { creatorId, id } = await params;
  return creatorSongCrud.getOne(req, creatorId, id);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ creatorId: string; id: string }> }) {
  const { creatorId, id } = await params;
  return creatorSongCrud.update(req, creatorId, id);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ creatorId: string; id: string }> }) {
  const { creatorId, id } = await params;
  return creatorSongCrud.remove(req, creatorId, id);
}
