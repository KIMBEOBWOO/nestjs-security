import { ForbiddenException, Injectable, NestMiddleware, Type } from '@nestjs/common';
import { getClientIp } from '@supercharge/request-ip';
import { ProfileOperator } from '../common';
import { IpBlackListValidationSecurityProfile } from '../interfaces';
import { ProfileStorage, ProfileValidator } from '../providers';

type ProfileInputType = Type<IpBlackListValidationSecurityProfile>[];

@Injectable()
export class IpBlackListMiddleware implements NestMiddleware {
  private static requiredProfiles: ProfileInputType = [];
  static allowProfiles(...profileList: ProfileInputType) {
    this.requiredProfiles = profileList;
    return this;
  }

  constructor(private readonly profileStorage: ProfileStorage) {}

  async use(request: Request, _: Response, next: (error?: unknown) => void) {
    const clientIP = getClientIp(request);

    // If there is no ipWhiteList, not allow all IP addresses.
    if (!clientIP) {
      throw new ForbiddenException();
    }

    const requiredProfileNames = this.getRequiredProfileNames();
    if (!requiredProfileNames || requiredProfileNames.length === 0) {
      next();
      return;
    }
    const requiredProfiles = this.profileStorage.getProfile(requiredProfileNames);

    // white list is only one acceptables
    const isValid = await ProfileValidator.applyProfiles(
      requiredProfiles,
      ProfileOperator.FOR_EVERY,
      request,
    );

    if (isValid) {
      next();
      return;
    } else {
      throw new ForbiddenException();
    }
  }

  private getRequiredProfileNames() {
    return IpBlackListMiddleware.requiredProfiles.map((profile) => profile.name);
  }
}