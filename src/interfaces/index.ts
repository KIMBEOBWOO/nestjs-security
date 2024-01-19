export interface IPValidationSecurityProfile {
  getIPWhiteList(): string[] | Promise<string[]>;
  getIPBlackList(): string[] | Promise<string[]>;
}

export class BaseSecurityProfile implements IPValidationSecurityProfile {
  getIPWhiteList(): string[] | Promise<string[]> {
    throw new Error('Method not implemented.');
  }

  getIPBlackList(): string[] | Promise<string[]> {
    throw new Error('Method not implemented.');
  }
}
