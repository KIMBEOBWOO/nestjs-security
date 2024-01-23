import { getClientIp } from '@supercharge/request-ip';

export interface SecurityProfile {
  /**
   * validate current context base on security profiles
   */
  validate(...param: any[]): Promise<boolean>;
}

export interface IpWhiteListValidationSchema {
  /**
   * return allow IP address list
   */
  getIpWhiteList(): string[] | Promise<string[]>;
}

export interface IpBlackListValidationSchema {
  /**
   * return reject IP address list
   */
  getIpBlackList(): string[] | Promise<string[]>;
}

export abstract class IpWhiteListValidationSecurityProfile
  implements SecurityProfile, IpWhiteListValidationSchema
{
  async validate(request: Request) {
    const currentIP = getClientIp(request);
    const ipWhiteList = await this.getIpWhiteList();

    // If there is no ipWhiteList, not allow all IP addresses.
    if (!currentIP || !ipWhiteList.includes(currentIP)) {
      return false;
    }

    return true;
  }

  abstract getIpWhiteList(): string[] | Promise<string[]>;
}

export abstract class IpBlackListValidationSecurityProfile
  implements SecurityProfile, IpBlackListValidationSchema
{
  async validate(request: Request) {
    const currentIP = getClientIp(request);
    const ipBlackList = await this.getIpBlackList();

    // If there is no ipBlackList, not allow all IP addresses.
    if (!currentIP || ipBlackList.includes(currentIP)) {
      return false;
    }

    return true;
  }

  abstract getIpBlackList(): string[] | Promise<string[]>;
}
