import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

export enum OrderStatus {
  pending = "pending",
  shipped = "shipped",
  canceled = "canceled",
  completed = "completed",
}

export class OrderProduct {
  @ApiProperty({
    example: "abc123",
    description: "ID of a product",
    required: true,
  })
  productId: string;

  @ApiProperty({
    example: 1,
    description: "The number of items being purchased",
    required: true,
  })
  quantity: number;

  reserved?: boolean;
}

export class OrderDto {
  items: OrderProduct[];

  @ApiProperty({
    example: "cus123",
    required: false,
  })
  customerId: string;

  @ApiProperty({
    example: "ord123",
    required: false,
  })
  orderId: string;

  @ApiProperty({
    example: "cus123",
    required: false,
    enum: OrderStatus,
  })
  status: OrderStatus;

  @ApiProperty({
    example: "Aus Post",
    required: false,
    enum: OrderStatus,
  })
  trackingCompany?: string;

  @ApiProperty({
    example: "EE 999 999 999 AU",
    required: false,
  })
  trackingNumber?: string;

  @ApiProperty({
    example: "https://auspost.com.au/mypost/track/",
    required: false,
  })
  trackingLink?: string;

  deleted?: boolean;
}

export class CreateOrderDto implements Omit<OrderDto, "status" | "orderId"> {
  @Type(() => OrderProduct)
  @ApiProperty({
    type: "array",
    items: {
      type: "object",
      properties: {
        productId: {
          type: "string",
          example: "abc123",
        },
        quantity: {
          type: "number",
          example: 1,
        },
      },
    },
    description: "The items in the order",
    required: true,
  })
  items: OrderProduct[];

  @ApiProperty({ type: "string" })
  customerId: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty({
    example: "abc123",
    description: "The ID of the order",
    required: true,
  })
  orderId: string;

  @ApiProperty({
    example: "shipped",
    description: "The status of the order, e.g. Pending, Shipped, Completed",
    required: true,
  })
  status: OrderStatus;
}

// Generic name to allow extending for potential unique identifiers.
// Unlikely, but for example a composite key of orderId and status.
// This is basically just a demonstration of "forward thinking" and code re-usability
export class SingleOrderDto {
  @ApiProperty({
    example: "abc123",
    description: "The ID of the order",
    required: true,
    type: "string",
    oneOf: [{ type: "string" }],
  })
  orderId: string;
}

export class OperationResponseOrderDto {
  data: OrderDto;
  message: string;
  success: boolean;
}
