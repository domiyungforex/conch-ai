import { financialTransactionCrud } from "@/modules/financial-intelligence/service";

export async function GET(req: Request, { params }: { params: Promise<{ accountId: string; id: string }> }) {
  const { accountId, id } = await params;
  return financialTransactionCrud.getOne(req, accountId, id);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ accountId: string; id: string }> }) {
  const { accountId, id } = await params;
  return financialTransactionCrud.update(req, accountId, id);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ accountId: string; id: string }> }) {
  const { accountId, id } = await params;
  return financialTransactionCrud.remove(req, accountId, id);
}
