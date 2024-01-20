import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Type,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ProfileOperator } from '../common';
import { SECURITY_METADATA_KEY } from '../decorators';
import { ProfileStorage, ProfileValidator } from '../providers';

@Injectable()
export class IPCheckGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly profileStorage: ProfileStorage,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    const requiredProfileNames = this.getRequiredProfileNames(context);
    // If there is no requiredProfiles, it means that the request is not decorated with @SetSecurityProfile.
    if (!requiredProfileNames || requiredProfileNames.length === 0) {
      return true;
    }
    const requiredProfiles = this.profileStorage.getProfile(requiredProfileNames);

    // white list is only one acceptables
    const isValid = await ProfileValidator.applyProfiles(
      requiredProfiles,
      ProfileOperator.AT_LEAST_ONE,
      request,
    );

    if (isValid) {
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
