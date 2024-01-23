import { DynamicModule, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { ProfileStorage } from './providers';

@Module({})
export class SecurityModule {
  static forRoot(): DynamicModule {
    return {
      imports: [DiscoveryModule],
      module: SecurityModule,
      providers: [ProfileStorage],
      exports: [ProfileStorage],
      // TODO : if resolve securityProfileStorage dependencies, remove global
      global: true,
    };
  }
}
