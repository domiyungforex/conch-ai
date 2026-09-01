import { COLLECTIONS } from "@/lib/db";
import { createOwnedCrud, createChildCrud } from "@/lib/moduleCrud";
import {
  CreatorCreateSchema, CreatorUpdateSchema,
  CreatorSongCreateSchema, CreatorSongUpdateSchema,
  CreatorIdeaCreateSchema, CreatorIdeaUpdateSchema,
  CreatorCampaignCreateSchema, CreatorCampaignUpdateSchema,
  CreatorCollaboratorCreateSchema, CreatorCollaboratorUpdateSchema,
  CreatorContentCreateSchema, CreatorContentUpdateSchema,
} from "@/lib/validators";

const MODULE = "creator_ai" as const;

export const creatorCrud = createOwnedCrud({
  collection: COLLECTIONS.CREATORS,
  module: MODULE,
  createSchema: CreatorCreateSchema,
  updateSchema: CreatorUpdateSchema,
});

const childConfig = { parentCollection: COLLECTIONS.CREATORS, parentField: "creatorId", module: MODULE } as const;

export const creatorSongCrud = createChildCrud({
  ...childConfig,
  collection: COLLECTIONS.CREATOR_SONGS,
  createSchema: CreatorSongCreateSchema,
  updateSchema: CreatorSongUpdateSchema,
});

export const creatorIdeaCrud = createChildCrud({
  ...childConfig,
  collection: COLLECTIONS.CREATOR_IDEAS,
  createSchema: CreatorIdeaCreateSchema,
  updateSchema: CreatorIdeaUpdateSchema,
});

export const creatorCampaignCrud = createChildCrud({
  ...childConfig,
  collection: COLLECTIONS.CREATOR_CAMPAIGNS,
  createSchema: CreatorCampaignCreateSchema,
  updateSchema: CreatorCampaignUpdateSchema,
});

export const creatorCollaboratorCrud = createChildCrud({
  ...childConfig,
  collection: COLLECTIONS.CREATOR_COLLABORATORS,
  createSchema: CreatorCollaboratorCreateSchema,
  updateSchema: CreatorCollaboratorUpdateSchema,
});

export const creatorContentCrud = createChildCrud({
  ...childConfig,
  collection: COLLECTIONS.CREATOR_CONTENT,
  createSchema: CreatorContentCreateSchema,
  updateSchema: CreatorContentUpdateSchema,
});
