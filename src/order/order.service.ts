import { Inject, Injectable } from "@nestjs/common";
import { DrizzleAsyncProvider } from "../drizzle/drizzle.provider";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../drizzle/schema";
import { OrderItems, Orders } from "../drizzle/schema";
import {
  CreateOrderDto,
  OrderDto,
  OrderProduct,
  OrderStatus,
  SingleOrderDto,
} from "./dto/order.dto";
import { and, eq } from "drizzle-orm";

@Injectable()
export class OrderService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
  ) {}

  async saveOrder({
    customerId,
    items,
  }: CreateOrderDto): Promise<OrderDto | null> {
    // Write order to DB
    const order_insert = await this.db
      .insert(Orders)
      .values({ customerId, status: OrderStatus.pending })
      .returning({
        id: Orders.orderId,
        customerId: Orders.customerId,
        status: Orders.status,
      });
    const order = order_insert?.[0];

    if (!order?.id || !order?.customerId) {
      return null;
    }

    // Before adding items, confirm the stock exists
    const confirmStockLevel = await this.reserveStock({
      items,
      orderId: order.id,
    });

    if (!confirmStockLevel.reserved) {
      // If we cannot proceed with the order we need to hard delete it to prevent bloating
      await this.db.delete(Orders).where(eq(Orders.orderId, order.id));

      return {
        orderId: order.id,
        items: confirmStockLevel.items,
        customerId,
        status: OrderStatus.canceled,
      };
    }

    // We have confirmed and reserved stock so update the order in DB
    const insertedItems = await this.db
      .insert(OrderItems)
      .values(
        items.map((i) => ({
          orderId: order.id,
          productId: i.productId,
          quantity: i.quantity,
        })),
      )
      .returning({
        productId: OrderItems.productId,
        quantity: OrderItems.quantity,
      });

    return {
      orderId: order.id,
      items: insertedItems.filter((i) => i.quantity) as OrderProduct[],
      customerId: order.customerId ?? "",
      status: OrderStatus.pending,
    };
  }

  async updateOrder(updateOrderDto: OrderDto): Promise<OrderDto | null> {
    // Write order to DB
    await this.db
      .update(Orders)
      .set({
        // Only update specific fields, this limits capabilities as items would require further processing for things like inventory
        customerId: updateOrderDto.customerId, // This is significant and could require further processing
        trackingCompany: updateOrderDto.trackingCompany,
        trackingNumber: updateOrderDto.trackingNumber,
        trackingLink: updateOrderDto.trackingLink,
        status: updateOrderDto.status,
      })
      .where(eq(Orders.orderId, updateOrderDto.orderId));

    // Rather than return from the update query, we re-use the existing get query to fetch the entire order
    return await this.getOrder({ orderId: updateOrderDto.orderId });
  }

  async softDeleteOrder({ orderId }: SingleOrderDto): Promise<OrderDto | null> {
    // Write order to DB
    await this.db
      .update(Orders)
      .set({
        deleted: true,
      })
      .where(eq(Orders.orderId, orderId));

    // Rather than return from the update query, we re-use the existing get query to fetch the entire order
    return await this.getOrder({ orderId: orderId });
  }

  async getOrder({ orderId }: SingleOrderDto): Promise<OrderDto | null> {
    // Read order from DB
    const orderQuery = await this.db
      .select()
      .from(Orders)
      .innerJoin(OrderItems, eq(OrderItems.orderId, Orders.orderId))
      .where(and(eq(Orders.orderId, orderId), eq(Orders.deleted, false)));

    const order = orderQuery?.[0]?.orders;

    if (!order) {
      return null;
    }

    return {
      orderId: order.orderId,
      customerId: order.customerId,
      status: order.status as OrderStatus,
      trackingCompany: order.trackingCompany,
      trackingNumber: order.trackingNumber,
      trackingLink: order.trackingLink,
      items: orderQuery.map((oq) => oq.order_item),
    } as OrderDto;
  }

  async reserveStock({
    orderId,
    items,
  }: {
    orderId: string;
    items: OrderProduct[];
  }): Promise<{ orderId: string; items: OrderProduct[]; reserved: boolean }> {
    // POST call to Inventory service to reserve stock.
    // This could also be achieved with setting a reserved stock count in RDS/DynamoDB.
    // I would suggest RDS as there are millions of products.
    // Allocation would be to a specific order ID

    // Mock response from Inventory service with test case for demonstration purposes
    const orderItems = items.map((i) =>
      i.productId === "outOfStock"
        ? { ...i, reserved: false }
        : { ...i, reserved: true },
    );

    return {
      orderId,
      items: orderItems,
      // Confirm all items are reserved
      reserved: !orderItems.find((i) => !i.reserved),
    };
  }
}
