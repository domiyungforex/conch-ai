import { businessProductCrud } from "@/modules/business-ai/service";

export async function GET(req: Request, { params }: { params: Promise<{ businessId: string; id: string }> }) {
  const { businessId, id } = await params;
  return businessProductCrud.getOne(req, businessId, id);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ businessId: string; id: string }> }) {
  const { businessId, id } = await params;
  return businessProductCrud.update(req, businessId, id);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ businessId: string; id: string }> }) {
  const { businessId, id } = await params;
  return businessProductCrud.remove(req, businessId, id);
}
