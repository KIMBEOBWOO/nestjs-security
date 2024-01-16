import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DiscoveryModule } from '@nestjs/core';
import configuration from './configuration';

@Module({
  imports: [
    DiscoveryModule,
    ConfigModule.forRoot({
      load: [configuration],
      envFilePath: ['.env.test'],
    }),
  ],
})
export class AppModule {}
