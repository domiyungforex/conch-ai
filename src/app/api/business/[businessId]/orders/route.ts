import { businessOrderCrud } from "@/modules/business-ai/service";

export async function GET(req: Request, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  return businessOrderCrud.list(req, businessId);
}

export async function POST(req: Request, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  return businessOrderCrud.create(req, businessId);
}
