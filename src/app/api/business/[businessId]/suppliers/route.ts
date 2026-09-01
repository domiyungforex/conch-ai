import { businessSupplierCrud } from "@/modules/business-ai/service";

export async function GET(req: Request, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  return businessSupplierCrud.list(req, businessId);
}

export async function POST(req: Request, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  return businessSupplierCrud.create(req, businessId);
}
