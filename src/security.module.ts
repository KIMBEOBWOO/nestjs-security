import { DynamicModule, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { SecurityProfileStorage } from './providers';

@Module({})
export class SecurityModule {
  static forRoot(): DynamicModule {
    return {
      imports: [DiscoveryModule],
      module: SecurityModule,
      providers: [SecurityProfileStorage],
      exports: [SecurityProfileStorage],
    };
  }
}
