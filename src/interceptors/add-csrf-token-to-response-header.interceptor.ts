import { ExecutionContext, Injectable } from '@nestjs/common';
import { CSRF_TOKEN_HEADER } from '../common';
import { CSRFTokenPostInterceptor } from './csrf-token-post-interceptor';

@Injectable()
export class AddCsrfTokenToResponseHeaderInterceptor extends CSRFTokenPostInterceptor {
  override addTokenToResponse(context: ExecutionContext, token: string): void {
    const response = context.switchToHttp().getResponse();
    // set csrf token to response header
    response.setHeader(CSRF_TOKEN_HEADER, token);
  }
}
