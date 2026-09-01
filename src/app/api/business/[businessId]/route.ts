import { businessCrud } from "@/modules/business-ai/service";

export async function GET(req: Request, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  return businessCrud.getOne(req, businessId);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  return businessCrud.update(req, businessId);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  return businessCrud.remove(req, businessId);
}
