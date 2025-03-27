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
  async get(@Param() params: SingleOrderDto) {
    try {
      const order = await this.orderService.getOrder({
        ...params,
      });

      if (order) {
        return order;
      }
    } catch (e) {
      console.error(`Failed to fetch order with id ${params.orderId}`, e);
    }

    throw new HttpException("Not found", HttpStatus.NOT_FOUND);
  }

  @ApiOkResponse({
    type: OperationResponseOrderDto,
    isArray: false,
  })
  @Post("/create")
  async create(@Body() createOrderDto: CreateOrderDto) {
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
  }

  @ApiOkResponse({
    type: OperationResponseOrderDto,
    isArray: false,
  })
  @Put("/update")
  async update(@Body() updateOrderDto: OrderDto) {
    const existingOrder = await this.orderService.getOrder({
      ...updateOrderDto,
    });

    if (!existingOrder) {
      throw new HttpException("Not found", HttpStatus.NOT_FOUND);
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
      status: updateOrderDto.status ?? existingOrder.status,
      trackingLink: updateOrderDto.trackingLink ?? existingOrder.trackingLink,
      trackingCompany:
        updateOrderDto.trackingCompany ?? existingOrder.trackingCompany,
      trackingNumber:
        updateOrderDto.trackingNumber ?? existingOrder.trackingNumber,
    };

    const updatedOrder = await this.orderService.updateOrder(mergedOrder);

    if (!updatedOrder) {
      console.error(`Failed to update order ${updateOrderDto.orderId}`);
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
  }

  @ApiOkResponse({
    type: OperationResponseOrderDto,
    isArray: false,
  })
  @Delete("/delete")
  async delete(@Body() deleteOrderDto: SingleOrderDto) {
    const existingOrder = await this.orderService.getOrder({
      ...deleteOrderDto,
    });

    if (!existingOrder) {
      throw new HttpException("Not found", HttpStatus.NOT_FOUND);
    }

    const updatedOrder = await this.orderService.softDeleteOrder({
      ...deleteOrderDto,
    });

    if (!updatedOrder) {
      console.error(`Failed to soft delete order ${deleteOrderDto.orderId}`);
      return null;
    }

    // Publish deleted event
    await this.eventBusService.publish("order.deleted", {
      orderId: updatedOrder.orderId,
    });

    return {
      data: updatedOrder,
      message: "Order marked for deletion",
      success: true,
    };
  }
}
