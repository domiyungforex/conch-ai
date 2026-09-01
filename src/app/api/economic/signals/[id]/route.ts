import { getSignal } from "@/modules/economic-intelligence/service";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return getSignal(req, id);
}
