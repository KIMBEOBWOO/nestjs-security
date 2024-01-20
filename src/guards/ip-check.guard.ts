import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Type,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SECURITY_METADATA_KEY } from '../decorators';
import { IpWhiteListValidationSecurityProfile } from '../interfaces';
import { SecurityProfileStorage } from '../providers';

@Injectable()
export class IPCheckGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly securityProfileStorage: SecurityProfileStorage,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    const requiredProfileNames = this.getRequiredProfileNames(context);
    // If there is no requiredProfiles, it means that the request is not decorated with @SetSecurityProfile.
    if (!requiredProfileNames || requiredProfileNames.length === 0) {
      return true;
    }
    const requiredProfiles = this.securityProfileStorage.getProfile(requiredProfileNames);

    // white list is only one acceptables
    const validateResults: boolean[] = await Promise.all(
      requiredProfiles.map((profile: IpWhiteListValidationSecurityProfile) =>
        profile.validate(request),
      ),
    );

    if (validateResults.some((result) => result === true)) {
      return true;
    } else {
      throw new ForbiddenException();
    }
  }

  private getRequiredProfileNames(context: ExecutionContext) {
    return this.reflector
      .getAllAndOverride<Type<any>[] | undefined>(SECURITY_METADATA_KEY, [
        context.getHandler(),
        context.getClass(),
      ])
      ?.map((profile) => profile.name);
  }
}
