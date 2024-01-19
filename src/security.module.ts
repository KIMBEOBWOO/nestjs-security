import { DynamicModule, Module } from '@nestjs/common';

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
