import { financialAccountCrud } from "@/modules/financial-intelligence/service";

export async function GET(req: Request, { params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  return financialAccountCrud.getOne(req, accountId);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  return financialAccountCrud.update(req, accountId);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  return financialAccountCrud.remove(req, accountId);
}
