import { creatorCollaboratorCrud } from "@/modules/creator-ai/service";

export async function GET(req: Request, { params }: { params: Promise<{ creatorId: string; id: string }> }) {
  const { creatorId, id } = await params;
  return creatorCollaboratorCrud.getOne(req, creatorId, id);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ creatorId: string; id: string }> }) {
  const { creatorId, id } = await params;
  return creatorCollaboratorCrud.update(req, creatorId, id);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ creatorId: string; id: string }> }) {
  const { creatorId, id } = await params;
  return creatorCollaboratorCrud.remove(req, creatorId, id);
}
