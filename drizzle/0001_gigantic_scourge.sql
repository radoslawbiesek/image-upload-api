ALTER TABLE "images" ADD COLUMN "fit" text DEFAULT 'cover' NOT NULL;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN "processed_at" timestamp;