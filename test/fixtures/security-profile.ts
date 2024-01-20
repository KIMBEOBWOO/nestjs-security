import { ConfigService } from '@nestjs/config';
import { IpWhiteListValidationSecurityProfile, SecurityProfileSchema } from '../../src';

@SecurityProfileSchema()
export class TestSecurityProfile extends IpWhiteListValidationSecurityProfile {
  getIpWhiteList(): string[] {
    return ['127.0.0.1', '192.168.0.1', '192.168.0.2'];
  }
}

@SecurityProfileSchema()
export class TestSecurityProfile2 extends IpWhiteListValidationSecurityProfile {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  getIpWhiteList(): string[] {
    const ipWhiteList = this.configService.get<string>('testIPaddress');
    if (!ipWhiteList) {
      throw new Error('IP_WHITE_LIST is not defined.');
    }

    return [ipWhiteList];
  }
}
