import { Injectable, ExecutionContext } from '@nestjs/common';
import { getClientIp } from '@supercharge/request-ip';
import { MissingIpAddressInRequestError, ForbiddenIpAddressError } from '../exceptions';
import { ProfileValidationInfoDefinedByMiddleware } from '../interfaces';
import { ProfileGuard } from './profile-guard';

/**
 * The `IpProfileGuard` class is an abstract class that extends the `ProfileGuard` class.
 * - ProfileGuard for the requested IP address must inherit that abstract class.
 * - Provides the ability to obtain an IP address from a request object and to return custom errors based on verification results.
 */
@Injectable()
export abstract class IpProfileGuard extends ProfileGuard {
  protected getProfileArguments(context: ExecutionContext): unknown[] {
    const request = context.switchToHttp().getRequest();
    const ipAddress = getClientIp(request);

    // If there is no IP address in the request, it means that the request is not valid.
    // so, block all requests without an IP address
    if (!ipAddress) {
      throw new MissingIpAddressInRequestError();
    }

    return [ipAddress];
  }

  protected validate(validationResult: ProfileValidationInfoDefinedByMiddleware) {
    if (validationResult.profileValidationResult) {
      return true;
    } else {
      throw new ForbiddenIpAddressError(
        validationResult.requiredProfileNames.join(', '),
        validationResult.profileArguments[0] as string,
      );
    }
  }
}
