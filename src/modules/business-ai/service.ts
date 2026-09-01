import { COLLECTIONS } from "@/lib/db";
import { createOwnedCrud, createChildCrud } from "@/lib/moduleCrud";
import {
  BusinessCreateSchema, BusinessUpdateSchema,
  BusinessCustomerCreateSchema, BusinessCustomerUpdateSchema,
  BusinessSupplierCreateSchema, BusinessSupplierUpdateSchema,
  BusinessProductCreateSchema, BusinessProductUpdateSchema,
  BusinessOrderCreateSchema, BusinessOrderUpdateSchema,
  BusinessInventoryCreateSchema, BusinessInventoryUpdateSchema,
  BusinessExpenseCreateSchema, BusinessExpenseUpdateSchema,
  BusinessRevenueCreateSchema, BusinessRevenueUpdateSchema,
} from "@/lib/validators";

const MODULE = "business_ai" as const;

export const businessCrud = createOwnedCrud({
  collection: COLLECTIONS.BUSINESSES,
  module: MODULE,
  createSchema: BusinessCreateSchema,
  updateSchema: BusinessUpdateSchema,
});

const childConfig = { parentCollection: COLLECTIONS.BUSINESSES, parentField: "businessId", module: MODULE } as const;

export const businessCustomerCrud = createChildCrud({
  ...childConfig,
  collection: COLLECTIONS.BUSINESS_CUSTOMERS,
  createSchema: BusinessCustomerCreateSchema,
  updateSchema: BusinessCustomerUpdateSchema,
});

export const businessSupplierCrud = createChildCrud({
  ...childConfig,
  collection: COLLECTIONS.BUSINESS_SUPPLIERS,
  createSchema: BusinessSupplierCreateSchema,
  updateSchema: BusinessSupplierUpdateSchema,
});

export const businessProductCrud = createChildCrud({
  ...childConfig,
  collection: COLLECTIONS.BUSINESS_PRODUCTS,
  createSchema: BusinessProductCreateSchema,
  updateSchema: BusinessProductUpdateSchema,
});

export const businessOrderCrud = createChildCrud({
  ...childConfig,
  collection: COLLECTIONS.BUSINESS_ORDERS,
  createSchema: BusinessOrderCreateSchema,
  updateSchema: BusinessOrderUpdateSchema,
});

export const businessInventoryCrud = createChildCrud({
  ...childConfig,
  collection: COLLECTIONS.BUSINESS_INVENTORY,
  createSchema: BusinessInventoryCreateSchema,
  updateSchema: BusinessInventoryUpdateSchema,
});

export const businessExpenseCrud = createChildCrud({
  ...childConfig,
  collection: COLLECTIONS.BUSINESS_EXPENSES,
  createSchema: BusinessExpenseCreateSchema,
  updateSchema: BusinessExpenseUpdateSchema,
});

export const businessRevenueCrud = createChildCrud({
  ...childConfig,
  collection: COLLECTIONS.BUSINESS_REVENUES,
  createSchema: BusinessRevenueCreateSchema,
  updateSchema: BusinessRevenueUpdateSchema,
});
