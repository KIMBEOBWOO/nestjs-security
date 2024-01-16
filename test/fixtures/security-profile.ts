import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IPValidationSecurityProfile } from '../../src';

@Injectable()
export class TestSecurityProfile implements IPValidationSecurityProfile {
  getIPWhiteList(): string[] {
    return ['127.0.0.1', '192.168.0.1', '192.168.0.2'];
  }
}

@Injectable()
export class TestSecurityProfile2 implements IPValidationSecurityProfile {
  constructor(private readonly configService: ConfigService) {}

  getIPWhiteList(): string[] {
    const ipWhiteList = this.configService.get<string>('testIPaddress');
    if (!ipWhiteList) {
      throw new Error('IP_WHITE_LIST is not defined.');
    }

    return [ipWhiteList];
  }
}
