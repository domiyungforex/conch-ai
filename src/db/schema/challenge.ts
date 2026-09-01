import { pgTable, text, timestamp, uuid, integer, boolean, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';

// Enums
export const participantRoleEnum = pgEnum('participant_role', ['developer', 'creator', 'founder', 'student', 'other']);
export const submissionStatusEnum = pgEnum('submission_status', ['draft', 'submitted', 'reviewing', 'approved', 'rejected', 'locked']);
export const challengePhaseEnum = pgEnum('challenge_phase', ['upcoming', 'open', 'building', 'submission', 'judging', 'completed']);
export const projectStatusEnum = pgEnum('project_status', ['idea', 'in_progress', 'demo', 'submitted', 'judged', 'featured']);

// Waitlist signups
export const waitlistSignups = pgTable('challenge_waitlist_signups', {
  id: uuid('id').primaryKey().defaultRandom(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull().unique(),
  twitterHandle: text('twitter_handle'),
  discordUsername: text('discord_username'),
  role: participantRoleEnum('role').notNull(),
  buildIdea: text('build_idea'),
  country: text('country'),
  referralCode: text('referral_code'),
  referredBy: uuid('referred_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Challenge configuration
export const challenges = pgTable('challenge', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull().default('The Conch Creator Challenge'),
  description: text('description'),
  phase: challengePhaseEnum('phase').notNull().default('upcoming'),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  submissionDeadline: timestamp('submission_deadline'),
  judgingStart: timestamp('judging_start'),
  winnerAnnouncementDate: timestamp('winner_announcement_date'),
  totalPrizeFund: integer('total_prize_fund').notNull().default(5000),
  firstPrize: integer('first_prize').notNull().default(2500),
  secondPrize: integer('second_prize').notNull().default(1500),
  thirdPrize: integer('third_prize').notNull().default(1000),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Challenge participants
export const challengeParticipants = pgTable('challenge_participants', {
  id: uuid('id').primaryKey().defaultRandom(),
  challengeId: uuid('challenge_id').notNull().references(() => challenges.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  waitlistSignupId: uuid('waitlist_signup_id').references(() => waitlistSignups.id, { onDelete: 'set null' }),
  fullName: text('full_name').notNull(),
  email: text('email').notNull(),
  twitterHandle: text('twitter_handle'),
  discordUsername: text('discord_username'),
  role: participantRoleEnum('role').notNull(),
  country: text('country'),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  referralCode: text('referral_code'),
});

// Challenge projects
export const challengeProjects = pgTable('challenge_projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  challengeId: uuid('challenge_id').notNull().references(() => challenges.id, { onDelete: 'cascade' }),
  participantId: uuid('participant_id').notNull().references(() => challengeParticipants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  oneLiner: text('one_liner'),
  description: text('description'),
  problemSolved: text('problem_solved'),
  conchUsage: text('conch_usage'),
  memoryImplementation: text('memory_implementation'),
  agentImplementation: text('agent_implementation'),
  demoUrl: text('demo_url'),
  videoUrl: text('video_url'),
  githubUrl: text('github_url'),
  coverImageUrl: text('cover_image_url'),
  status: projectStatusEnum('status').notNull().default('idea'),
  featured: boolean('featured').default(false),
  featuredAt: timestamp('featured_at'),
  teamMembers: jsonb('team_members'),
  conchFeaturesUsed: jsonb('conch_features_used'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Project media (screenshots, etc.)
export const projectMedia = pgTable('project_media', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => challengeProjects.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  alt: text('alt'),
  type: text('type').notNull().default('screenshot'),
  orderIndex: integer('order_index').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Project submissions
export const projectSubmissions = pgTable('project_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => challengeProjects.id, { onDelete: 'cascade' }),
  status: submissionStatusEnum('status').notNull().default('draft'),
  submittedAt: timestamp('submitted_at'),
  lockedAt: timestamp('locked_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Judges
export const judges = pgTable('challenge_judges', {
  id: uuid('id').primaryKey().defaultRandom(),
  challengeId: uuid('challenge_id').notNull().references(() => challenges.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  title: text('title'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Judging scores
export const scores = pgTable('challenge_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  submissionId: uuid('submission_id').notNull().references(() => projectSubmissions.id, { onDelete: 'cascade' }),
  judgeId: uuid('judge_id').notNull().references(() => judges.id, { onDelete: 'cascade' }),
  innovation: integer('innovation').notNull(),
  persistentMemoryUse: integer('persistent_memory_use').notNull(),
  agentImplementation: integer('agent_implementation').notNull(),
  usefulnessImpact: integer('usefulness_impact').notNull(),
  presentation: integer('presentation').notNull(),
  totalScore: integer('total_score').notNull(),
  comments: text('comments'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Winners
export const winners = pgTable('challenge_winners', {
  id: uuid('id').primaryKey().defaultRandom(),
  challengeId: uuid('challenge_id').notNull().references(() => challenges.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').notNull().references(() => challengeProjects.id, { onDelete: 'cascade' }),
  participantId: uuid('participant_id').notNull().references(() => challengeParticipants.id, { onDelete: 'cascade' }),
  placement: integer('placement').notNull(),
  prizeAmount: integer('prize_amount').notNull(),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Referrals
export const referrals = pgTable('challenge_referrals', {
  id: uuid('id').primaryKey().defaultRandom(),
  referrerSignupId: uuid('referrer_signup_id').notNull().references(() => waitlistSignups.id, { onDelete: 'cascade' }),
  referredSignupId: uuid('referred_signup_id').notNull().references(() => waitlistSignups.id, { onDelete: 'cascade' }),
  code: text('code').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Notifications
export const challengeNotifications = pgTable('challenge_notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  recipientEmail: text('recipient_email'),
  type: text('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  read: boolean('read').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Audit/event log
export const challengeEvents = pgTable('challenge_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: text('type').notNull(),
  actorId: uuid('actor_id'),
  actorEmail: text('actor_email'),
  data: jsonb('data'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
