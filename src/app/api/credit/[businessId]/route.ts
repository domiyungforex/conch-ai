import { getProfile } from "@/modules/credit-intelligence/service";

export async function GET(req: Request, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  return getProfile(req, businessId);
}
