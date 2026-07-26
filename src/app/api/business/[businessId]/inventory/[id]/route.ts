import { businessInventoryCrud } from "@/modules/business-ai/service";

export async function GET(req: Request, { params }: { params: Promise<{ businessId: string; id: string }> }) {
  const { businessId, id } = await params;
  return businessInventoryCrud.getOne(req, businessId, id);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ businessId: string; id: string }> }) {
  const { businessId, id } = await params;
  return businessInventoryCrud.update(req, businessId, id);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ businessId: string; id: string }> }) {
  const { businessId, id } = await params;
  return businessInventoryCrud.remove(req, businessId, id);
}
