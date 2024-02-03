import { ExecutionContext, Injectable } from '@nestjs/common';
import { CSRFTokenPostInterceptor } from './csrf-token-post-interceptor';

@Injectable()
export class AddCsrfTokenToResponseHeaderInterceptor extends CSRFTokenPostInterceptor {
  override addTokenToResponse(context: ExecutionContext, token: string): void {
    const response = context.switchToHttp().getResponse();
    // set csrf token to response header
    response.setHeader('x-csrf-token', token);
  }
}
