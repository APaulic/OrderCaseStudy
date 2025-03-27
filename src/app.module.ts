import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { OrderModule } from "./order/order.module";
import { DrizzleModule } from "./drizzle/drizzle.module";
import { ConfigModule } from "@nestjs/config";
import { EventBusService } from "./event-bus/event-bus.service";
import { EventBusController } from "./event-bus/event-bus.controller";
import { EventBusModule } from './event-bus/event-bus.module';

@Module({
  imports: [
    OrderModule,
    DrizzleModule,
    ConfigModule.forRoot({ isGlobal: true }),
    EventBusModule,
  ],
  controllers: [AppController, EventBusController],
  providers: [EventBusService],
})
export class AppModule {}
