import { businessSupplierCrud } from "@/modules/business-ai/service";

export async function GET(req: Request, { params }: { params: Promise<{ businessId: string; id: string }> }) {
  const { businessId, id } = await params;
  return businessSupplierCrud.getOne(req, businessId, id);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ businessId: string; id: string }> }) {
  const { businessId, id } = await params;
  return businessSupplierCrud.update(req, businessId, id);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ businessId: string; id: string }> }) {
  const { businessId, id } = await params;
  return businessSupplierCrud.remove(req, businessId, id);
}
