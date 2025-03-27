CREATE TABLE "order_item" (
	"order_item_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid,
	"product_id" text,
	"quantity" integer
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"order_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" text,
	"tracking_company" text,
	"tracking_number" text,
	"tracking_link" text,
	"deleted" boolean DEFAULT false,
	"status" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
