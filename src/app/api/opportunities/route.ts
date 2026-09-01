import { opportunityCrud } from "@/modules/opportunity-engine/service";

export const GET = opportunityCrud.list;
export const POST = opportunityCrud.create;
