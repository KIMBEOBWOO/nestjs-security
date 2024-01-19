import { DynamicModule, Module } from '@nestjs/common';

/**
 * @deprecated Updated after v0.1.0
 */
@Module({})
export class SecurityModule {
  static forRoot(): DynamicModule {
    return {
      imports: [],
      module: SecurityModule,
      providers: [],
    };
  }
}
