import { ApiProperty } from "@nestjs/swagger";

export enum OrderStatus {
  pending = "pending",
  shipped = "shipped",
  canceled = "canceled",
  completed = "completed",
}

export class OrderProduct {
  @ApiProperty({
    example: "prod-123",
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
    example: "cus-123",
    required: false,
  })
  customerId: string;

  orderId: string;

  @ApiProperty({
    example: "pending",
    required: false,
    enum: OrderStatus,
  })
  status: OrderStatus;

  @ApiProperty({
    example: "Australia Post",
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
  @ApiProperty({
    type: "array",
    items: {
      type: "object",
      properties: {
        productId: {
          type: "string",
          example: "prod-123",
        },
        quantity: {
          type: "number",
          example: 3,
        },
      },
    },
    description: "The items in the order",
    required: true,
  })
  items: OrderProduct[];

  @ApiProperty({ type: "string", example: "cus-123" })
  customerId: string;
}

export class UpdateOrderDto implements Omit<OrderDto, "orderId" | "deleted"> {
  items: OrderProduct[];

  @ApiProperty({
    example: "cus-123",
    required: false,
  })
  customerId: string;

  @ApiProperty({
    example: "pending",
    required: false,
    enum: OrderStatus,
  })
  status: OrderStatus;

  @ApiProperty({
    example: "Australia Post",
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
}

// Generic name to allow extending for potential unique identifiers.
// Unlikely, but for example a composite key of orderId and status.
// This is basically just a demonstration of "forward thinking" and code re-usability
export class SingleOrderDto {
  @ApiProperty({
    example: "9610b8bc-4b9f-46b3-b050-e73318cfa73e",
    description: "The ID of the order",
    required: true,
    type: "string",
    oneOf: [{ type: "string" }],
  })
  orderId: string;
}

export class OperationResponseOrderDto {
  data: Omit<OrderDto, "orderId" | "deleted">;
  message: string;
  success: boolean;
}
