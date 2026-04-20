ALTER TABLE "images" ADD CONSTRAINT "images_key_unique" UNIQUE("key");--> statement-breakpoint
ALTER TABLE "images" ADD CONSTRAINT "images_source_key_unique" UNIQUE("source_key");