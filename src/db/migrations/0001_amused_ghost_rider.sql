CREATE TYPE "public"."challenge_phase" AS ENUM('upcoming', 'open', 'building', 'submission', 'judging', 'completed');--> statement-breakpoint
CREATE TYPE "public"."participant_role" AS ENUM('developer', 'creator', 'founder', 'student', 'other');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('idea', 'in_progress', 'demo', 'submitted', 'judged', 'featured');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('draft', 'submitted', 'reviewing', 'approved', 'rejected', 'locked');--> statement-breakpoint
CREATE TABLE "challenge_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"actor_id" uuid,
	"actor_email" text,
	"data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "challenge_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_email" text,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "challenge_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"challenge_id" uuid NOT NULL,
	"user_id" uuid,
	"waitlist_signup_id" uuid,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"twitter_handle" text,
	"discord_username" text,
	"role" "participant_role" NOT NULL,
	"country" text,
	"bio" text,
	"avatar_url" text,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"referral_code" text
);
--> statement-breakpoint
CREATE TABLE "challenge_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"challenge_id" uuid NOT NULL,
	"participant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"one_liner" text,
	"description" text,
	"problem_solved" text,
	"conch_usage" text,
	"memory_implementation" text,
	"agent_implementation" text,
	"demo_url" text,
	"video_url" text,
	"github_url" text,
	"cover_image_url" text,
	"status" "project_status" DEFAULT 'idea' NOT NULL,
	"featured" boolean DEFAULT false,
	"featured_at" timestamp,
	"team_members" jsonb,
	"conch_features_used" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "challenge_projects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "challenge" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text DEFAULT 'The Conch Creator Challenge' NOT NULL,
	"description" text,
	"phase" "challenge_phase" DEFAULT 'upcoming' NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"submission_deadline" timestamp,
	"judging_start" timestamp,
	"winner_announcement_date" timestamp,
	"total_prize_fund" integer DEFAULT 5000 NOT NULL,
	"first_prize" integer DEFAULT 2500 NOT NULL,
	"second_prize" integer DEFAULT 1500 NOT NULL,
	"third_prize" integer DEFAULT 1000 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "challenge_judges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"challenge_id" uuid NOT NULL,
	"user_id" uuid,
	"name" text NOT NULL,
	"title" text,
	"avatar_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"url" text NOT NULL,
	"alt" text,
	"type" text DEFAULT 'screenshot' NOT NULL,
	"order_index" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"status" "submission_status" DEFAULT 'draft' NOT NULL,
	"submitted_at" timestamp,
	"locked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "challenge_referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referrer_signup_id" uuid NOT NULL,
	"referred_signup_id" uuid NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "challenge_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"judge_id" uuid NOT NULL,
	"innovation" integer NOT NULL,
	"persistent_memory_use" integer NOT NULL,
	"agent_implementation" integer NOT NULL,
	"usefulness_impact" integer NOT NULL,
	"presentation" integer NOT NULL,
	"total_score" integer NOT NULL,
	"comments" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "challenge_waitlist_signups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"twitter_handle" text,
	"discord_username" text,
	"role" "participant_role" NOT NULL,
	"build_idea" text,
	"country" text,
	"referral_code" text,
	"referred_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "challenge_waitlist_signups_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "challenge_winners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"challenge_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"participant_id" uuid NOT NULL,
	"placement" integer NOT NULL,
	"prize_amount" integer NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"preferred_translation" text DEFAULT 'kjv',
	"theme" text DEFAULT 'light',
	"font_size" text DEFAULT 'medium',
	"memory_enabled" text DEFAULT 'true',
	"show_verse_numbers" text DEFAULT 'true',
	"daily_reminder" text DEFAULT 'false',
	"reminder_time" text DEFAULT '08:00',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "challenge_participants" ADD CONSTRAINT "challenge_participants_challenge_id_challenge_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenge"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_participants" ADD CONSTRAINT "challenge_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_participants" ADD CONSTRAINT "challenge_participants_waitlist_signup_id_challenge_waitlist_signups_id_fk" FOREIGN KEY ("waitlist_signup_id") REFERENCES "public"."challenge_waitlist_signups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_projects" ADD CONSTRAINT "challenge_projects_challenge_id_challenge_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenge"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_projects" ADD CONSTRAINT "challenge_projects_participant_id_challenge_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."challenge_participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_judges" ADD CONSTRAINT "challenge_judges_challenge_id_challenge_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenge"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_judges" ADD CONSTRAINT "challenge_judges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_media" ADD CONSTRAINT "project_media_project_id_challenge_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."challenge_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_submissions" ADD CONSTRAINT "project_submissions_project_id_challenge_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."challenge_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_referrals" ADD CONSTRAINT "challenge_referrals_referrer_signup_id_challenge_waitlist_signups_id_fk" FOREIGN KEY ("referrer_signup_id") REFERENCES "public"."challenge_waitlist_signups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_referrals" ADD CONSTRAINT "challenge_referrals_referred_signup_id_challenge_waitlist_signups_id_fk" FOREIGN KEY ("referred_signup_id") REFERENCES "public"."challenge_waitlist_signups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_scores" ADD CONSTRAINT "challenge_scores_submission_id_project_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."project_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_scores" ADD CONSTRAINT "challenge_scores_judge_id_challenge_judges_id_fk" FOREIGN KEY ("judge_id") REFERENCES "public"."challenge_judges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_winners" ADD CONSTRAINT "challenge_winners_challenge_id_challenge_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenge"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_winners" ADD CONSTRAINT "challenge_winners_project_id_challenge_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."challenge_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_winners" ADD CONSTRAINT "challenge_winners_participant_id_challenge_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."challenge_participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;