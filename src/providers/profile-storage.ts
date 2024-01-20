import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { DEFULAT_SECURITY_PROFILE_NAME, SECURITY_PROFILE_METADATA_KEY } from '../decorators';
import { SecurityProfile } from '../interfaces';

@Injectable()
export class ProfileStorage implements OnApplicationBootstrap {
  private readonly profileMap = new Map<string, SecurityProfile>();

  constructor(private readonly discoveryService: DiscoveryService) {}

  onApplicationBootstrap() {
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
      .forEach((wrapper) => {
        const metadata = Reflect.getMetadata(SECURITY_PROFILE_METADATA_KEY, wrapper.metatype);
        const name = metadata === DEFULAT_SECURITY_PROFILE_NAME ? wrapper.metatype.name : metadata;

        if (this.profileMap.has(name)) {
          throw new Error(`Duplicated security profile name: ${name}`);
        }

        this.profileMap.set(name, wrapper.instance);
      });
  }

  getProfile(names: string[]) {
    const profiles = [];

    for (const name of names) {
      const profile = this.profileMap.get(name);
      if (!profile) throw new Error('Not Exist profile');
      profiles.push(profile);
    }

    return profiles;
  }
}
