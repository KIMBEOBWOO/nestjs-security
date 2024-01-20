import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DiscoveryModule } from '@nestjs/core';
import { SecurityModule } from '../../src';
import configuration from './configuration';
import { TestSecurityProfile, TestSecurityProfile2 } from './security-profile';

@Module({
  imports: [
    SecurityModule.forRoot(),
    DiscoveryModule,
    ConfigModule.forRoot({
      load: [configuration],
      envFilePath: ['.env.test'],
    }),
  ],
  providers: [TestSecurityProfile, TestSecurityProfile2],
})
export class AppModule {}

// ip 주소 화이트 리스트, 블랙리스트
// csrf 공격 방어
// ddos 방어 -> 트래픽 제한 거는거
