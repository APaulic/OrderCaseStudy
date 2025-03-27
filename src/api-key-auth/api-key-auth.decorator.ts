import { applyDecorators, UseGuards } from "@nestjs/common";
import { ApiHeader } from "@nestjs/swagger";
import { ApiKeyAuthGuard } from "./api-key-auth.guard";

/*
 * Demonstration of a decorator to secure a specific endpoint. Originally had the intention to not secure the GET
 * endpoint /:id to allow unsecured reads, however, given these are orders they could be perceived as private.
 * */
export const ApiKeyAuth = () =>
  applyDecorators(
    ApiHeader({
      name: "x-api-key",
      description: "API key required",
      required: true,
    }),
    UseGuards(ApiKeyAuthGuard),
  );
