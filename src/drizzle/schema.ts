import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const Orders = pgTable("orders", {
  orderId: uuid("order_id").defaultRandom().primaryKey(), // auto-incrementing primary key field
  customerId: text("customer_id"),
  trackingCompany: text("tracking_company"),
  trackingNumber: text("tracking_number"),
  trackingLink: text("tracking_link"),
  deleted: boolean("deleted").default(false),
  status: text("status"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const OrdersRelations = relations(Orders, ({ many }) => ({
  items: many(OrderItems),
}));

export const OrderItems = pgTable("order_item", {
  id: uuid("order_item_id").defaultRandom().primaryKey(),
  orderId: uuid("order_id"), // PostgreSQL column name allows queries with "USING order_id"
  productId: text("product_id"),
  quantity: integer("quantity"),
});

export const OrderItemsRelations = relations(OrderItems, ({ one }) => ({
  items: one(Orders, {
    fields: [OrderItems.orderId],
    references: [Orders.orderId],
  }),
}));
