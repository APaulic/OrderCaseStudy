import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { OrderService } from "./order.service";
import {
  CreateOrderDto,
  OperationResponseOrderDto,
  OrderDto,
  OrderStatus,
  SingleOrderDto,
  UpdateOrderDto,
} from "./dto/order.dto";
import { ApiOkResponse, ApiSecurity } from "@nestjs/swagger";
import { ApiKeyAuthGuard } from "../api-key-auth/api-key-auth.guard";
import { EventBusService } from "../event-bus/event-bus.service";
import { CacheInterceptor } from "@nestjs/cache-manager";
import { CacheTTL } from "@nestjs/common/cache";

@CacheTTL(5000)
@UseGuards(ApiKeyAuthGuard)
@ApiSecurity("apiKey")
@UseInterceptors(CacheInterceptor)
@Controller("order")
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly eventBusService: EventBusService,
  ) {}

  @ApiOkResponse({
    type: OrderDto,
    isArray: false,
  })
  @Get(":orderId")
  async get(@Param() { orderId }: SingleOrderDto) {
    try {
      const order = await this.orderService.getOrder({
        orderId,
      });

      if (order) {
        return order;
      }
    } catch (e) {
      console.error(`Failed to fetch order with id ${orderId}`, e);
    }

    throw new HttpException("Not found", HttpStatus.NOT_FOUND);
  }

  @ApiOkResponse({
    type: OperationResponseOrderDto,
    isArray: false,
  })
  @Post("/create")
  async create(@Body() createOrderDto: CreateOrderDto) {
    try {
      const isValidCustomer = await this.orderService.validateCustomer({
        customerId: createOrderDto.customerId,
      });
      if (!isValidCustomer) {
        return {
          data: createOrderDto,
          message: "Invalid customer",
          success: false,
        };
      }

      const savedOrder = await this.orderService.saveOrder({
        ...createOrderDto,
      });

      if (savedOrder?.status !== OrderStatus.pending) {
        console.error(`Order, ${savedOrder?.orderId}, not saved to database.`);
        return {
          data: savedOrder,
          message: "Order not created",
          success: false,
        };
      }

      // Publish created event
      await this.eventBusService.publish("order.created", {
        orderId: savedOrder.orderId,
      });

      return {
        data: savedOrder,
        message: "Order created",
        success: true,
      };
    } catch (error) {
      console.error(
        `Failed to create order for customer ${createOrderDto.customerId}`,
        error,
      );
      return {
        data: null,
        message: "Failed to create order",
        success: false,
      };
    }
  }

  @ApiOkResponse({
    type: OperationResponseOrderDto,
    isArray: false,
  })
  @Put("/update/:orderId")
  async update(
    @Param() { orderId }: SingleOrderDto,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    try {
      const existingOrder = await this.orderService.getOrder({
        orderId,
      });

      if (!existingOrder) {
        throw new HttpException("Not found", HttpStatus.NOT_FOUND);
      }

      const isValidCustomer = await this.orderService.validateCustomer({
        customerId: updateOrderDto.customerId,
      });

      if (!isValidCustomer) {
        return {
          data: updateOrderDto,
          message: "Invalid customer",
          success: false,
        };
      }

      // Check new status is valid
      if (
        updateOrderDto.status &&
        !Object.values(OrderStatus).includes(
          <OrderStatus>updateOrderDto.status?.toLowerCase(),
        )
      ) {
        throw new HttpException("Invalid order status", HttpStatus.BAD_REQUEST);
      }

      const mergedOrder: OrderDto = {
        ...existingOrder,
        customerId: updateOrderDto.customerId ?? existingOrder.customerId,
        status: updateOrderDto.status ?? existingOrder.status,
        trackingLink: updateOrderDto.trackingLink ?? existingOrder.trackingLink,
        trackingCompany:
          updateOrderDto.trackingCompany ?? existingOrder.trackingCompany,
        trackingNumber:
          updateOrderDto.trackingNumber ?? existingOrder.trackingNumber,
      };

      const updatedOrder = await this.orderService.updateOrder(mergedOrder);

      if (!updatedOrder) {
        console.error(`Failed to update order ${orderId}`);
        return null;
      }

      // Publish updated event
      await this.eventBusService.publish("order.updated", {
        orderId: updatedOrder.orderId,
      });

      return {
        data: updatedOrder,
        message: "Order updated",
        success: true,
      };
    } catch (error) {
      console.error(
        `Failed to update order for customer ${updateOrderDto.customerId}, orderId: ${orderId}`,
        error,
      );
      return {
        data: null,
        message: "Failed to update order",
        success: false,
      };
    }
  }

  @ApiOkResponse({
    type: OperationResponseOrderDto,
    isArray: false,
  })
  @Delete("/delete/:orderId")
  async delete(@Param() { orderId }: SingleOrderDto) {
    const existingOrder = await this.orderService.getOrder({
      orderId,
    });

    if (!existingOrder) {
      throw new HttpException("Not found", HttpStatus.NOT_FOUND);
    }

    try {
      await this.orderService.softDeleteOrder({
        orderId,
      });

      // Publish deleted event
      await this.eventBusService.publish("order.deleted", {
        orderId,
      });

      return {
        data: null,
        message: "Order marked for deletion",
        success: true,
      };
    } catch (error) {
      console.error(`Failed to soft delete order: ${orderId}`, error);
      return {
        data: null,
        message: "Failed to delete order",
        success: false,
      };
    }
  }
}
