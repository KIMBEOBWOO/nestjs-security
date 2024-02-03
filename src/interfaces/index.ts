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

export interface CSRFTokenValidationSchema {
  /**
   * generate CSRF token
   */
  generateCSRFToken(...param: unknown[]): string | Promise<string>;
}

/**
 * check if object is CSRFTokenValidationSchema
 * @param obj object to check
 * @returns true if object is CSRFTokenValidationSchema
 */
export const isCSRFTokenValidationSchema = (obj: any): obj is CSRFTokenValidationSchema => {
  return obj.generateCSRFToken !== undefined;
};

export interface SignedCSRFTokenValidationSchema extends CSRFTokenValidationSchema {
  generateCSRFToken(request: Request): string | Promise<string>;
}
