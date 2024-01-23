import { ConfigService } from '@nestjs/config';
import {
  IpBlackListValidationSecurityProfile,
  IpWhiteListValidationSecurityProfile,
  SecurityProfileSchema,
} from '../../src';

@SecurityProfileSchema()
export class NaiveWhiteListProfile extends IpWhiteListValidationSecurityProfile {
  getIpWhiteList(): string[] {
    return ['127.0.0.1', '192.168.0.1', '192.168.0.2'];
  }
}

@SecurityProfileSchema()
export class EnvWhiteListProfile extends IpWhiteListValidationSecurityProfile {
  constructor(private readonly configService: ConfigService<any, true>) {
    super();
  }

  getIpWhiteList(): string[] {
    const ipWhiteList = this.configService.get<string>('testIPaddress');
    return [ipWhiteList];
  }
}

@SecurityProfileSchema()
export class NaiveBlackListProfile extends IpBlackListValidationSecurityProfile {
  getIpBlackList(): string[] {
    return ['192.168.1.3', '192.168.1.4'];
  }
}

@SecurityProfileSchema()
export class EnvBlackListProfile extends IpBlackListValidationSecurityProfile {
  constructor(private readonly configService: ConfigService<any, true>) {
    super();
  }

  getIpBlackList(): string[] {
    const ipBlackList = this.configService.get<string>('testIPaddress');
    return [ipBlackList];
  }
}
