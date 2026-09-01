import { COLLECTIONS } from "@/lib/db";
import { createOwnedCrud } from "@/lib/moduleCrud";
import { OpportunityCreateSchema, OpportunityUpdateSchema } from "@/lib/validators";

export const opportunityCrud = createOwnedCrud({
  collection: COLLECTIONS.OPPORTUNITIES,
  module: "opportunity_engine",
  createSchema: OpportunityCreateSchema,
  updateSchema: OpportunityUpdateSchema,
});
