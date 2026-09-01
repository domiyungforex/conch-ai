CREATE TABLE "bible_books" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"testament" text NOT NULL,
	"name" text NOT NULL,
	"short_name" text NOT NULL,
	"book_order" integer NOT NULL,
	"chapter_count" integer NOT NULL,
	CONSTRAINT "bible_books_book_order_unique" UNIQUE("book_order")
);
--> statement-breakpoint
CREATE TABLE "bible_chapters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"book_id" uuid NOT NULL,
	"chapter_number" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bible_verses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chapter_id" uuid NOT NULL,
	"verse_number" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "translations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"publisher" text,
	"license" text,
	"public_domain" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "translations_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "verse_text" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"verse_id" uuid NOT NULL,
	"translation_id" uuid NOT NULL,
	"text" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verse_embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"verse_id" uuid NOT NULL,
	"translation_id" uuid NOT NULL,
	"embedding" vector(1536),
	"model" text DEFAULT 'text-embedding-3-small' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"email_verified" boolean DEFAULT false,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "entity_relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_type" text NOT NULL,
	"source_id" uuid NOT NULL,
	"target_type" text NOT NULL,
	"target_id" uuid NOT NULL,
	"relationship" text NOT NULL,
	"provenance" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "people" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"short_description" text,
	"testament" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "places" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"short_description" text,
	"modern_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "themes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "themes_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "verse_people" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"verse_id" uuid NOT NULL,
	"person_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verse_themes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"verse_id" uuid NOT NULL,
	"theme_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"verse_id" uuid NOT NULL,
	"label" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "highlights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"verse_id" uuid NOT NULL,
	"color" text DEFAULT '#fbbf24',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"verse_id" uuid,
	"title" text,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bible_chapters" ADD CONSTRAINT "bible_chapters_book_id_bible_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."bible_books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bible_verses" ADD CONSTRAINT "bible_verses_chapter_id_bible_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."bible_chapters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verse_text" ADD CONSTRAINT "verse_text_verse_id_bible_verses_id_fk" FOREIGN KEY ("verse_id") REFERENCES "public"."bible_verses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verse_text" ADD CONSTRAINT "verse_text_translation_id_translations_id_fk" FOREIGN KEY ("translation_id") REFERENCES "public"."translations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verse_embeddings" ADD CONSTRAINT "verse_embeddings_verse_id_bible_verses_id_fk" FOREIGN KEY ("verse_id") REFERENCES "public"."bible_verses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verse_embeddings" ADD CONSTRAINT "verse_embeddings_translation_id_translations_id_fk" FOREIGN KEY ("translation_id") REFERENCES "public"."translations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verse_people" ADD CONSTRAINT "verse_people_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verse_themes" ADD CONSTRAINT "verse_themes_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "highlights" ADD CONSTRAINT "highlights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_chapter_book_number" ON "bible_chapters" USING btree ("book_id","chapter_number");--> statement-breakpoint
CREATE INDEX "idx_verse_chapter_number" ON "bible_verses" USING btree ("chapter_id","verse_number");--> statement-breakpoint
CREATE INDEX "idx_verse_text_verse_translation" ON "verse_text" USING btree ("verse_id","translation_id");--> statement-breakpoint
CREATE INDEX "idx_verse_embeddings_hnsw" ON "verse_embeddings" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "idx_verse_embeddings_verse" ON "verse_embeddings" USING btree ("verse_id");--> statement-breakpoint
CREATE INDEX "idx_entity_rel_source" ON "entity_relationships" USING btree ("source_type","source_id");--> statement-breakpoint
CREATE INDEX "idx_entity_rel_target" ON "entity_relationships" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "idx_verse_people_verse" ON "verse_people" USING btree ("verse_id");--> statement-breakpoint
CREATE INDEX "idx_bookmarks_user" ON "bookmarks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_highlights_user" ON "highlights" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notes_user" ON "notes" USING btree ("user_id");