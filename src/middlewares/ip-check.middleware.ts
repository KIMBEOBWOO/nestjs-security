import { ForbiddenException, Injectable, NestMiddleware, Type } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { getClientIp } from '@supercharge/request-ip';
import { IPValidationSecurityProfile } from '../interfaces';
import { SECURITY_PROFILE_METADATA_KEY } from '../decorators';

@Injectable()
export class IPCheckMiddleware implements NestMiddleware {
  private readonly profileMap = new Map<string, InstanceWrapper<IPValidationSecurityProfile>>();
  private static requiredProfiles: Type<IPValidationSecurityProfile>[] = [];

  static setProfiles(...profileList: Type<IPValidationSecurityProfile>[]) {
    this.requiredProfiles = profileList;
    return this;
  }

  constructor(private readonly discoveryService: DiscoveryService) {
    const instanceWrapperFilter = (provider: InstanceWrapper) => {
      if (provider.metatype) {
        const metadata = Reflect.getMetadata(SECURITY_PROFILE_METADATA_KEY, provider.metatype);
        if (metadata) return true;
      }

      return false;
    };

    this.discoveryService
      .getProviders()
      .filter(instanceWrapperFilter)
      .forEach((provider: InstanceWrapper) => {
        this.profileMap.set(provider.name as string, provider);
      });
  }

  use(req: Request, _: Response, next: (error?: unknown) => void) {
    const clientIP = getClientIp(req);

    // If there is no ipWhiteList, not allow all IP addresses.
    if (!clientIP) {
      throw new ForbiddenException();
    }

    const requiredProfiles = IPCheckMiddleware.requiredProfiles;
    if (requiredProfiles.length > 0) {
      const ipWhiteList = this.getIPWhiteList(IPCheckMiddleware.requiredProfiles);

      if (!ipWhiteList.includes(clientIP)) {
        throw new ForbiddenException();
      }
    }

    next();
  }

  private getIPWhiteList(requiredProfiles: Type<IPValidationSecurityProfile>[]): string[] {
    const mapValues = this.profileMap.values();
    const requiredProfilesNames = requiredProfiles.map((profile) => profile.name);
    const ipWhiteList = Array.from(mapValues)
      .filter((profile) => profile.name && requiredProfilesNames.includes(profile.name))
      .map((profile) => profile.instance.getIPWhiteList())
      .flat();

    return ipWhiteList;
  }
}
