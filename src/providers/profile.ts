import { HttpStatus } from '@nestjs/common';
import { Netmask } from 'netmask';
import { SecurityModuleError } from '../exceptions';
import {
  SecurityProfile,
  IpWhiteListValidationSchema,
  IpBlackListValidationSchema,
} from '../interfaces';
import { isIpV4 } from '../utils';

export abstract class IpWhiteListValidationSecurityProfile
  implements SecurityProfile, IpWhiteListValidationSchema
{
  async validate(ipAddress: string) {
    const ipWhiteList = await this.getIpWhiteList();

    for (const allowIpAddress of ipWhiteList) {
      // if address is not ipv4 address, throw error.
      if (!isIpV4(allowIpAddress)) {
        throw new SecurityModuleError(
          'The current library only supports validation for ipv4 address types. It will support ipv6 in version 0.1.0 and later.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // if allowIpAddress is IPv4 address, check allowIpAddress range includes ipAddress.
      if (new Netmask(allowIpAddress).contains(ipAddress)) return true;
    }

    return false;
  }

  abstract getIpWhiteList(): string[] | Promise<string[]>;
}

export abstract class IpBlackListValidationSecurityProfile
  implements SecurityProfile, IpBlackListValidationSchema
{
  async validate(ipAddress: string) {
    const ipBlackList = await this.getIpBlackList();

    for (const blockIpAddress of ipBlackList) {
      // if address is not ipv4 address, throw error.
      if (!isIpV4(blockIpAddress)) {
        throw new SecurityModuleError(
          'The current library only supports validation for ipv4 address types. It will support ipv6 in version 0.1.0 and later.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // if blockIpAddress is IPv4 address, check blockIpAddress range includes ipAddress.
      if (new Netmask(blockIpAddress).contains(ipAddress)) return false;
    }

    return true;
  }

  abstract getIpBlackList(): string[] | Promise<string[]>;
}
