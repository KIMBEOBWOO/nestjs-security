import { DynamicModule, Module, Type } from '@nestjs/common';
import { APP_GUARD, DiscoveryModule } from '@nestjs/core';
import { IPCheckGuard } from './ip-check.guard';
import { BaseSecurityProfile } from './security-profile';

const SECURITY_PROFILE_INJECT_PREFIX = '@nestj-security/profile/';

interface SecurityModuleOption {
  profiles: Type<BaseSecurityProfile>[];
}

@Module({})
export class SecurityModule {
  static forRoot(option: SecurityModuleOption): DynamicModule {
    const { profiles } = option;

    const profileProviders = profiles.map((profile) => ({
      provide: SECURITY_PROFILE_INJECT_PREFIX + profile.name,
      useClass: profile,
    }));

    return {
      imports: [DiscoveryModule],
      module: SecurityModule,
      providers: [
        {
          provide: APP_GUARD,
          useClass: IPCheckGuard,
        },
        ...profileProviders,
      ],
      exports: [...profileProviders.map((provider) => provider.provide)],
    };
  }
}
