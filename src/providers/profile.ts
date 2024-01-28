import {
  SecurityProfile,
  IpWhiteListValidationSchema,
  IpBlackListValidationSchema,
} from '../interfaces';

export abstract class IpWhiteListValidationSecurityProfile
  implements SecurityProfile, IpWhiteListValidationSchema
{
  async validate(ipAddress: string) {
    const ipWhiteList = await this.getIpWhiteList();

    // If there is no ipWhiteList, not allow all IP addresses.
    if (!ipWhiteList.includes(ipAddress)) {
      return false;
    }

    return true;
  }

  abstract getIpWhiteList(): string[] | Promise<string[]>;
}

export abstract class IpBlackListValidationSecurityProfile
  implements SecurityProfile, IpBlackListValidationSchema
{
  async validate(ipAddress: string) {
    const ipBlackList = await this.getIpBlackList();

    // If there is no ipBlackList, not allow all IP addresses.
    if (ipBlackList.includes(ipAddress)) {
      return false;
    }

    return true;
  }

  abstract getIpBlackList(): string[] | Promise<string[]>;
}
