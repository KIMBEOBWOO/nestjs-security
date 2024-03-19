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

export interface SignedCSRFTokenValidationSchema extends CSRFTokenValidationSchema {
  generateCSRFToken(data: any): Promise<string>;
  validateCSRFToken(request: Request): Promise<boolean>;
}

/**
 * Validation Aggregation Information
 * - Information that can be used to ultimately determine effectiveness in classes such as middleware, guard, etc
 */
export interface ProfileValidationInfoDefinedByMiddleware {
  /**
   * The result of the profile validation.
   * @type {boolean} if the profileValidationResult is false, the request will be rejected.
   */
  profileValidationResult: boolean;
  /**
   * The requiredProfiles name.
   * @type {string[]} The requiredProfiles name.
   * collected profiles from @Security.{} decorators
   */
  requiredProfileNames: string[];
  /**
   * The arguments for the profile validation.
   * @type {unknown[]} The arguments for the profile validation.
   */
  profileArguments: unknown[];
}
