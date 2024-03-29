import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DiscoveryModule } from '@nestjs/core';
import { SecurityModule } from '../../src';
import configuration from './configuration';
import {
  NaiveBlackListProfile,
  NaiveWhiteListProfile,
  EnvBlackListProfile,
  EnvWhiteListProfile,
  CIDRBlackListProfile,
  CIDRWhiteListProfile,
  JwtCSRFTokenProfile,
  SessionCSRFTokenProfile,
} from './security-profile';

@Module({
  imports: [
    SecurityModule.forRoot(),
    DiscoveryModule,
    ConfigModule.forRoot({
      load: [configuration],
      envFilePath: ['.env.test'],
    }),
  ],
  providers: [
    NaiveBlackListProfile,
    NaiveWhiteListProfile,
    EnvBlackListProfile,
    EnvWhiteListProfile,
    CIDRBlackListProfile,
    CIDRWhiteListProfile,
    JwtCSRFTokenProfile,
    SessionCSRFTokenProfile,
  ],
})
export class AppModule {}
