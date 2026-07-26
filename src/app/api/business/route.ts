import { businessCrud } from "@/modules/business-ai/service";

export const GET = businessCrud.list;
export const POST = businessCrud.create;
