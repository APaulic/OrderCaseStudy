import { Test, TestingModule } from "@nestjs/testing";
import { OrderController } from "./order.controller";
import { OrderService } from "./order.service";
import { OrderStatus } from "./dto/order.dto";
import { EventBusService } from "../event-bus/event-bus.service";
import { DrizzleAsyncProvider } from "../drizzle/drizzle.provider";

describe("OrderController", () => {
  let controller: OrderController;
  let service: OrderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        OrderService,
        {
          provide: DrizzleAsyncProvider,
          useValue: {
            db: jest.fn(), // Mock database connection
          },
        },
        {
          provide: EventBusService,
          useValue: {
            publish: jest.fn(),
          },
        },
        {
          provide: "CACHE_MANAGER",
          useValue: {
            get: jest.fn().mockResolvedValue(null), // Mock cache get
            set: jest.fn().mockResolvedValue(undefined), // Mock cache set
            del: jest.fn().mockResolvedValue(undefined), // Mock cache delete
          },
        },
      ],
    }).compile();

    controller = module.get<OrderController>(OrderController);
    service = module.get<OrderService>(OrderService);

    jest.spyOn(console, "error").mockImplementation(() => {}); // Mock console.error
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("saveOrder", () => {
    it("should return a saved order", async () => {
      const order = {
        customerId: "cus123",
        items: [
          {
            productId: "abc123",
            quantity: 1,
          },
        ],
      };

      jest.spyOn(service, "saveOrder").mockImplementation(() =>
        Promise.resolve({
          orderId: "abc123",
          ...order,
          items: [
            {
              productId: "abc123",
              quantity: 1,
              reserved: true,
            },
          ],
          status: OrderStatus.pending,
        }),
      );

      expect(
        await controller.create({
          ...order,
        }),
      ).toEqual({
        data: {
          customerId: "cus123",
          items: [
            {
              productId: "abc123",
              quantity: 1,
              reserved: true,
            },
          ],
          orderId: "abc123",
          status: "pending",
        },
        message: "Order created",
        success: true,
      });
    });

    it("should return canceled order if out of stock", async () => {
      const order = {
        customerId: "cus123",
        items: [
          {
            productId: "outOfStock",
            quantity: 1,
          },
        ],
      };

      jest.spyOn(service, "saveOrder").mockImplementation(() =>
        Promise.resolve({
          orderId: "abc123",
          ...order,
          items: [
            {
              productId: "outOfStock",
              quantity: 1,
              reserved: false,
            },
          ],
          status: OrderStatus.canceled,
        }),
      );

      const createResult = await controller.create({
        ...order,
      });

      expect(console.error).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        "Order, abc123, not saved to database.",
      );
      expect(createResult).toEqual({
        data: {
          customerId: "cus123",
          items: [
            {
              productId: "outOfStock",
              quantity: 1,
              reserved: false,
            },
          ],
          orderId: "abc123",
          status: "canceled",
        },
        message: "Order not created",
        success: false,
      });
    });
  });
});
