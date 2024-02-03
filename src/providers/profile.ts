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
import crypto from 'crypto';

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
    const csrfToken = (request.headers as any)['x-csrf-token'] as string;
    const sessionID = await this.getSessionID(request);
    const expectedCsrfToken = await this.generateCSRFToken(sessionID);

    // if csrfToken is not equal to expectedCsrfToken, return false.
    if (
      typeof csrfToken !== 'string' ||
      csrfToken.length < 10 ||
      this.checkFormat(csrfToken) ||
      csrfToken !== expectedCsrfToken
    ) {
      return false;
    }

    return true;
  }

  abstract getSessionID(request: Request): string | Promise<string>;
  abstract getSecretKey(): string | Promise<string>;

  private async generateCSRFToken(sessionID: string) {
    const timestamp = Date.now(); // timestamp
    const nonce = Math.random().toString(36).substring(2, 15); // nonce for recycle attack
    const message = `${sessionID}!${timestamp}!${nonce}`; // message (csrf payload)

    const secretKey = await this.getSecretKey(); // secret key for hmac
    const hmac = crypto.createHmac('sha256', secretKey).update(message).digest('hex');

    return `${hmac}.${message}`;
  }

  private checkFormat(csrfToken: string) {
    const [hmac, message] = csrfToken.split('.');
    if (!hmac || !message) return false;

    const [sessionID, timestamp, nonce] = message.split('!');
    if (!sessionID || !timestamp || !nonce) return false;

    return true;
  }
}
