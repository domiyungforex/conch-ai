import { grantConsent } from "@/modules/credit-intelligence/service";

export async function POST(req: Request, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  return grantConsent(req, businessId);
}
