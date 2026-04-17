CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
CREATE TABLE "images" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"title" text NOT NULL,
	"url" text,
	"source_url" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX "images_title_trgm_idx" ON "images" USING gin ("title" gin_trgm_ops);