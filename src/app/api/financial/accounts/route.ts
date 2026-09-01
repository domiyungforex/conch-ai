import { financialAccountCrud } from "@/modules/financial-intelligence/service";

export const GET = financialAccountCrud.list;
export const POST = financialAccountCrud.create;
