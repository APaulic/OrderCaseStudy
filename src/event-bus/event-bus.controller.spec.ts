import { Test, TestingModule } from "@nestjs/testing";
import { EventBusController } from "./event-bus.controller";

describe("EventBusController", () => {
  let controller: EventBusController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventBusController],
    }).compile();

    controller = module.get<EventBusController>(EventBusController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
