import { ForbiddenException, Injectable, NestMiddleware, Type } from '@nestjs/common';
import { getClientIp } from '@supercharge/request-ip';
import { IPValidationSecurityProfile } from '../interfaces';
import { SecurityProfileStorage } from '../providers';

@Injectable()
export class IPCheckMiddleware implements NestMiddleware {
  private static requiredProfiles: Type<IPValidationSecurityProfile>[] = [];
  static allowProfiles(...profileList: Type<IPValidationSecurityProfile>[]) {
    this.requiredProfiles = profileList;
    return this;
  }

  constructor(private readonly securityProfileStorage: SecurityProfileStorage) {}

  async use(req: Request, _: Response, next: (error?: unknown) => void) {
    const clientIP = getClientIp(req);

    // If there is no ipWhiteList, not allow all IP addresses.
    if (!clientIP) {
      throw new ForbiddenException();
    }

    const requiredProfileNames = IPCheckMiddleware.requiredProfiles.map((profile) => profile.name);
    if (requiredProfileNames.length > 0) {
      const ipWhiteList = await this.getIPWhiteList(requiredProfileNames);

      if (!ipWhiteList.includes(clientIP)) {
        throw new ForbiddenException();
      }
    }

    next();
  }

  private async getIPWhiteList(requiredProfileNames: string[]): Promise<string[]> {
    const requiredProfiles = this.securityProfileStorage.getProfile(requiredProfileNames);

    const ipWhiteList = (
      await Promise.all(
        requiredProfiles.map((profile) =>
          (profile as IPValidationSecurityProfile).getIPWhiteList(),
        ),
      )
    ).flat();

    return ipWhiteList;
  }
}
