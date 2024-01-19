import { ConfigService } from '@nestjs/config';
import { IPValidationSecurityProfile, SecurityProfile } from '../../src';

@SecurityProfile()
export class TestSecurityProfile implements IPValidationSecurityProfile {
  getIPWhiteList(): string[] {
    return ['127.0.0.1', '192.168.0.1', '192.168.0.2'];
  }

  getIPBlackList(): string[] | Promise<string[]> {
    return [];
  }
}

@SecurityProfile()
export class TestSecurityProfile2 implements IPValidationSecurityProfile {
  constructor(private readonly configService: ConfigService) {}

  getIPWhiteList(): string[] {
    const ipWhiteList = this.configService.get<string>('testIPaddress');
    if (!ipWhiteList) {
      throw new Error('IP_WHITE_LIST is not defined.');
    }

    return [ipWhiteList];
  }

  getIPBlackList(): string[] | Promise<string[]> {
    return [];
  }
}
