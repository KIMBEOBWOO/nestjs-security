import { CanActivate, ExecutionContext, Injectable, Type } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { getClientIp } from '@supercharge/request-ip';
import { ProfileOperatorType } from '../common';
import { SECURITY_METADATA_KEY } from '../decorators';
import { ForbiddenIpAddressError, MissingIpAddressInRequestError } from '../exceptions';
import { ProfileStorage, ProfileValidator } from '../providers';

@Injectable()
export abstract class BaseIpProfileGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly profileStorage: ProfileStorage,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const ipAddress = getClientIp(request);

    // If there is no IP address in the request, it means that the request is not valid.
    if (!ipAddress) {
      throw new MissingIpAddressInRequestError();
    }

    const requiredProfileNames = this.getRequiredProfileNames(context);
    // If there is no requiredProfiles, it means that the request is not decorated with @SetSecurityProfile.
    if (!requiredProfileNames || requiredProfileNames.length === 0) {
      return true;
    }
    const requiredProfiles = this.profileStorage.getProfile(requiredProfileNames);

    // Execute the validate method of the requiredProfiles.
    const isValid = await ProfileValidator.applyProfiles(
      requiredProfiles,
      this.getOperator(),
      ipAddress,
    );

    if (isValid) {
      return true;
    } else {
      throw new ForbiddenIpAddressError(requiredProfileNames.join(', '), ipAddress);
    }
  }

  /**
   * Get the operator type of the requiredProfiles.
   * @returns {ProfileOperatorType} The operator type of the requiredProfiles.
   */
  protected abstract getOperator(): ProfileOperatorType;

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
}
