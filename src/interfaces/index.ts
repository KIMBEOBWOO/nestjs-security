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

  /**
   * validate CSRF token
   */
  validateCSRFToken(...param: unknown[]): boolean | Promise<boolean>;
}

/**
 * check if object is CSRFTokenValidationSchema
 * @param obj object to check
 * @returns true if object is CSRFTokenValidationSchema
 */
export const isCSRFTokenValidationSchema = (obj: any): obj is CSRFTokenValidationSchema => {
  return obj.generateCSRFToken !== undefined;
};

export type SignedCSRFTokenMessageType = Request;
export type SignedCSRFTokenType = string;

export interface SignedCSRFTokenValidationSchema extends CSRFTokenValidationSchema {
  generateCSRFToken(message: SignedCSRFTokenMessageType): Promise<SignedCSRFTokenType>;
  // validateCSRFToken(token: SignedCSRFTokenType): Promise<boolean>;
}
