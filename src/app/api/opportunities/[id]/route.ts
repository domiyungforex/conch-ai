import { opportunityCrud } from "@/modules/opportunity-engine/service";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return opportunityCrud.getOne(req, id);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return opportunityCrud.update(req, id);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return opportunityCrud.remove(req, id);
}
