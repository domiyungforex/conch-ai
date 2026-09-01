import { financialTransactionCrud } from "@/modules/financial-intelligence/service";

export async function GET(req: Request, { params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  return financialTransactionCrud.list(req, accountId);
}

export async function POST(req: Request, { params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  return financialTransactionCrud.create(req, accountId);
}
