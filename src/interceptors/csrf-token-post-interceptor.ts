import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
  Type,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { map, Observable } from 'rxjs';
import { SECURITY_METADATA_KEY } from '../decorators';
import { SecurityModuleError } from '../exceptions';
import { isCSRFTokenValidationSchema } from '../interfaces';
import { ProfileStorage } from '../providers';

@Injectable()
export abstract class CSRFTokenPostInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly profileStorage: ProfileStorage,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    return next.handle().pipe(
      map(async (data: any) => {
        // get profile from request metadata
        const requiredProfileNames = this.getRequiredProfileNames(context);
        // If there is no requiredProfiles, it means that the request is not decorated with @SetSecurityProfile.
        if (requiredProfileNames?.length !== 1) {
          throw new SecurityModuleError(
            'CSRFTokenPostInterceptor requires exactly one profile ',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
        const requiredProfile = this.profileStorage.getProfile(requiredProfileNames)[0];

        if (!isCSRFTokenValidationSchema(requiredProfile)) {
          throw new SecurityModuleError(
            `Not allowed profile(${requiredProfileNames}). CSRFTokenPostInterceptor requires only CSRFTokenValidationSchema`,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }

        // get session id from response data and generate csrf token
        const csrfToken = await requiredProfile.generateCSRFToken(data);

        // set csrf token to response
        this.addTokenToResponse(context, csrfToken);

        return data;
      }),
    );
  }

  /**
   * Get the requiredProfiles from the context.
   * @param context The execution context.
   * @returns {string[]} The requiredProfiles name.
   */
  private getRequiredProfileNames(context: ExecutionContext): string[] | undefined {
    return this.reflector
      .getAllAndOverride<Type<any>[] | undefined>(SECURITY_METADATA_KEY, [
        context.getHandler(),
        context.getClass(),
      ])
      ?.map((profile) => profile.name);
  }

  abstract addTokenToResponse(context: ExecutionContext, token: string): void;
}
