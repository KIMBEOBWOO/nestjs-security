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
export class CIDRBlackListProfile extends IpBlackListValidationSecurityProfile {
  getIpBlackList(): string[] {
    return [
      /**
       * - start  : 192.168.16.0
       * - end    : 192.168.31.255
       */
      '192.168.16.0/20',
      /**
       * - start  : 192.168.0.5
       * - end    : 192.168.0.5
       */
      '192.168.0.5/32',
    ];
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
