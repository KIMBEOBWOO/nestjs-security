import { ExecutionContext, Injectable } from '@nestjs/common';
import { ProfileOperator, ProfileOperatorType } from '../common';
import { ProfileGuard } from './profile-guard';

@Injectable()
export class SignedCSRFTokenGuard extends ProfileGuard {
  /**
   * Get the operator type of the requiredProfiles.
   * @returns {ProfileOperatorType} The operator type of the requiredProfiles.
   */
  protected getOperator(): ProfileOperatorType {
    return ProfileOperator.AT_LEAST_ONE;
  }

  protected getProfileArguments(context: ExecutionContext): unknown[] {
    const request = context.switchToHttp().getRequest();
    // CSRF Protection profile requires full access to the request object.
    // So, return the request object as the profile arguments.
    return [request];
  }
}
