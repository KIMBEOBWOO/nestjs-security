import { CanActivate, ExecutionContext, Injectable, Type } from '@nestjs/common';
import { DiscoveryService, Reflector } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { Observable } from 'rxjs';
import { getClientIp } from '@supercharge/request-ip/dist';
import { SECURITY_METADATA_KEY } from './security.decorator';
import { IPValidationSecurityProfile } from './interfaces';

@Injectable()
export class IPCheckGuard implements CanActivate {
  private profileMap = new Map<string, InstanceWrapper<IPValidationSecurityProfile>>();

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly reflector: Reflector,
  ) {
    const instanceWrapperFilter = (provider: InstanceWrapper) => true;

    this.discoveryService
      .getProviders()
      .filter(instanceWrapperFilter)
      .forEach((provider: InstanceWrapper) => {
        this.profileMap.set(provider.name as string, provider);
      });
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();

    const requiredProfiles = this.getRequiredProfiles(context);
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

  private getRequiredProfiles(
    context: ExecutionContext,
  ): Type<IPValidationSecurityProfile>[] | undefined {
    return this.reflector.getAllAndOverride<Type<IPValidationSecurityProfile>[] | undefined>(
      SECURITY_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );
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
