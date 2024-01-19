import { CanActivate, ExecutionContext, Injectable, Type } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { getClientIp } from '@supercharge/request-ip/dist';
import { SECURITY_METADATA_KEY } from '../decorators';
import { IPValidationSecurityProfile } from '../interfaces';
import { SecurityProfileStorage } from '../providers';

@Injectable()
export class IPCheckGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly securityProfileStorage: SecurityProfileStorage,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    const requiredProfiles = this.getRequiredProfileNames(context);
    // If there is no requiredProfiles, it means that the request is not decorated with @SetSecurityProfile.
    if (!requiredProfiles || requiredProfiles.length === 0) {
      return true;
    }

    const ipWhiteList = await this.getIPWhiteList(requiredProfiles);
    const clientIP = getClientIp(request);

    // If there is no ipWhiteList, not allow all IP addresses.
    if (!clientIP) {
      return false;
    }

    return ipWhiteList.includes(clientIP);
  }

  private getRequiredProfileNames(context: ExecutionContext) {
    return this.reflector
      .getAllAndOverride<Type<IPValidationSecurityProfile>[] | undefined>(SECURITY_METADATA_KEY, [
        context.getHandler(),
        context.getClass(),
      ])
      ?.map((profile) => profile.name);
  }

  private async getIPWhiteList(requiredProfileNames: string[]): Promise<string[]> {
    const requiredProfiles = this.securityProfileStorage.getProfile(requiredProfileNames);

    const ipWhiteList = (
      await Promise.all(
        requiredProfiles.map((profile) =>
          (profile as IPValidationSecurityProfile).getIPWhiteList(),
        ),
      )
    ).flat();

    return ipWhiteList;
  }
}
