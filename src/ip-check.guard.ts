import { CanActivate, ExecutionContext, Injectable, Type } from '@nestjs/common';
import { DiscoveryService, Reflector } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { Observable } from 'rxjs';
import { BaseSecurityProfile } from './security-profile';
import { getClientIp } from '@supercharge/request-ip/dist';
import { SECURITY_METADATA_KEY } from './security.decorator';

@Injectable()
export class IPCheckGuard implements CanActivate {
  private profileMap = new Map<string, InstanceWrapper<BaseSecurityProfile>>();

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly reflector: Reflector,
  ) {
    this.discoveryService
      .getProviders()
      .filter(
        (provider: InstanceWrapper) =>
          typeof provider.token === 'string' &&
          provider.token.startsWith('@nestj-security/profile'),
      )
      .forEach((provider: InstanceWrapper) => {
        this.profileMap.set(provider.name as string, provider);
      });
  }

  get profiles(): BaseSecurityProfile[] {
    const mapValues = this.profileMap.values();
    return Array.from(mapValues).map((profile) => profile.instance);
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();

    const requiredProfiles = this.reflector.getAllAndOverride<
      Type<BaseSecurityProfile>[] | undefined
    >(SECURITY_METADATA_KEY, [context.getHandler(), context.getClass()]);

    // If there is no requiredProfiles, it means that the request is not decorated with @SetSecurityProfile.
    if (!requiredProfiles || requiredProfiles.length === 0) {
      return true;
    }

    const ipWhiteList = this.getIPWhiteList(requiredProfiles);
    const clientIP = getClientIp(request);

    // If there is no ipWhiteList, not allow all IP addresses.
    if (!clientIP) {
      return false;
    }

    return ipWhiteList.includes(clientIP);
  }

  private getIPWhiteList(requiredProfiles: Type<BaseSecurityProfile>[]): string[] {
    const mapValues = this.profileMap.values();
    const requiredProfilesNames = requiredProfiles.map((profile) => profile.name);
    const ipWhiteList = Array.from(mapValues)
      .filter((profile) => profile.name && requiredProfilesNames.includes(profile.name))
      .map((profile) => profile.instance.getIPWhiteList())
      .flat();

    return ipWhiteList;
  }
}
