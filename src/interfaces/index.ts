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
