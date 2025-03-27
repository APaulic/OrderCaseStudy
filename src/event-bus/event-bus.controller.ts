import { Controller } from "@nestjs/common";
import { EventPattern } from "@nestjs/microservices";
import { OrderEventDto } from "./dto/event-bus.dto";

/*
 * This is a theoretical consumer to handle further events. If there were a purely event based architecture
 * orders would be saved to the DB here.
 * */
@Controller()
export class EventBusController {
  @EventPattern("order.created")
  async handleOrderCreated(orderEventDto: OrderEventDto) {
    console.log(`Processing order ${orderEventDto.orderId}`);
  }

  @EventPattern("order.updated")
  async handleOrderUpdated(orderEventDto: OrderEventDto) {
    // Useful for perhaps sending to a notification service to send emails to user?
    console.log(`Processing order ${orderEventDto.orderId}`);
  }

  @EventPattern("order.deleted")
  async handleOrderDeleted(orderEventDto: OrderEventDto) {
    // Update the InventoryService to release reserved stock
    console.log(`Processing order ${orderEventDto.orderId}`);
  }

  @EventPattern("customer.updated")
  async handleCustomerUpdated(orderEventDto: OrderEventDto) {
    // If the customer was updated for pending order there may be some action required here for re-calculating shipping etc
    console.log(`Updating existing orders ${orderEventDto.orderId}`);
  }
}
