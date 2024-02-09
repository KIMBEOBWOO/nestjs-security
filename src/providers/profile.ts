import { HttpStatus } from '@nestjs/common';
import { Netmask } from 'netmask';
import { SecurityModuleError } from '../exceptions';
import {
  SecurityProfile,
  IpWhiteListValidationSchema,
  IpBlackListValidationSchema,
  SignedCSRFTokenValidationSchema,
} from '../interfaces';
import { isIpV4 } from '../utils';
import * as crypto from 'crypto';
import { CSRF_TOKEN_HEADER } from '../common';

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

export abstract class SignedCSRFTokenSecurityProfile
  implements SecurityProfile, SignedCSRFTokenValidationSchema
{
  async validate(request: Request) {
    const requestCsrfToken = (request.headers as any)[CSRF_TOKEN_HEADER] as string;

    // for reduce hmac calculation, check token format first.
    // if token format is invalid, just return false.
    if (
      typeof requestCsrfToken !== 'string' ||
      requestCsrfToken.length < 10 ||
      !this.hasValidSignedCSRFTokenFormat(requestCsrfToken)
    ) {
      return false;
    }

    // if requestCsrfToken is not equal to expectedCsrfToken, return false.
    if (!(await this.validateCSRFToken(request))) return false;

    return true;
  }

  async generateCSRFToken(data: any): Promise<string> {
    const sessionID = await this.getSessionIDforCreate(data);

    const timestamp = Date.now(); // timestamp
    const nonce = Math.random().toString(36).substring(2, 15); // nonce for recycle attack
    const message = `${sessionID}!${timestamp}!${nonce}`; // message (csrf payload)

    return this.sign(message);
  }

  async validateCSRFToken(request: Request): Promise<boolean> {
    const currentSessionId = await this.getSessionIDforValidate(request);
    const token = (request.headers as any)[CSRF_TOKEN_HEADER] as string;
    const message = token.split('.')[1];
    const [sessionId] = message.split('!');
    const expectedCsrfToken = await this.sign(message);

    // if token hashed message is equal to expectedCsrfToken and requestSessionId is equal to sessionId, return true.
    if (token === expectedCsrfToken && currentSessionId === sessionId) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * sign csrf token
   * @param message message to sign
   * @returns signed csrf token
   */
  private async sign(message: string) {
    const secretKey = await this.getSecretKey(); // secret key for hmac
    const hmac = crypto.createHmac('sha256', secretKey).update(message).digest('hex');

    return `${hmac}.${message}`;
  }

  /**
   * check if csrf token has valid format
   * @param csrfToken csrf token to check
   * @returns true if csrf token has valid format
   */
  private hasValidSignedCSRFTokenFormat(csrfToken: string) {
    const [hmac, message] = csrfToken.split('.');
    if (!hmac || !message) return false;

    const [sessionID, timestamp, nonce] = message.split('!');
    if (!sessionID || !timestamp || !nonce) return false;

    return true;
  }

  /**
   * get session id from request
   * @param request request to get session id
   * @returns session id
   */
  abstract getSessionIDforCreate(data: any): string | Promise<string>;

  /**
   * get session id from request
   * @param request request to get session id
   */
  abstract getSessionIDforValidate(request: Request): string | Promise<string>;

  /**
   * get secret key for hmac
   * @returns secret key
   */
  abstract getSecretKey(): string | Promise<string>;
}
