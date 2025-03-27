import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Observable } from "rxjs";

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers["x-api-key"];
    const validApiKey = process.env.API_KEY;

    if (!apiKey || apiKey !== validApiKey) {
      throw new UnauthorizedException("Invalid API key");
    }

    return true;
  }
}
