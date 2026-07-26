import { COLLECTIONS } from "@/lib/db";
import { createOwnedCrud, createChildCrud } from "@/lib/moduleCrud";
import {
  FinancialAccountCreateSchema, FinancialAccountUpdateSchema,
  FinancialTransactionCreateSchema, FinancialTransactionUpdateSchema,
} from "@/lib/validators";

const MODULE = "financial_intelligence" as const;

export const financialAccountCrud = createOwnedCrud({
  collection: COLLECTIONS.FINANCIAL_ACCOUNTS,
  module: MODULE,
  createSchema: FinancialAccountCreateSchema,
  updateSchema: FinancialAccountUpdateSchema,
});

export const financialTransactionCrud = createChildCrud({
  collection: COLLECTIONS.FINANCIAL_TRANSACTIONS,
  module: MODULE,
  parentCollection: COLLECTIONS.FINANCIAL_ACCOUNTS,
  parentField: "accountId",
  createSchema: FinancialTransactionCreateSchema,
  updateSchema: FinancialTransactionUpdateSchema,
});
