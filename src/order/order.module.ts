import { Module } from "@nestjs/common";
import { OrderController } from "./order.controller";
import { OrderService } from "./order.service";
import { DrizzleModule } from "../drizzle/drizzle.module";
import { EventBusModule } from "../event-bus/event-bus.module";
import { CacheModule } from "@nestjs/cache-manager";

@Module({
  imports: [DrizzleModule, EventBusModule, CacheModule.register()],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
