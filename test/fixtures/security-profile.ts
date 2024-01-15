import { BaseSecurityProfile } from '../../src';

export class TestSecurityProfile extends BaseSecurityProfile {
  getIPWhiteList(): string[] {
    return ['127.0.0.1', '192.168.0.1', '192.168.0.2'];
  }
}

export class TestSecurityProfile2 extends BaseSecurityProfile {
  getIPWhiteList(): string[] {
    return ['192.168.0.3'];
  }
}
