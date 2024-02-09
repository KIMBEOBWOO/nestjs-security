import { Injectable } from '@nestjs/common';
import { ProfileOperatorType, ProfileOperator } from '../common';
import { BaseIpProfileGuard } from './base-ip-profile-guard';

@Injectable()
export class IpWhiteListGuard extends BaseIpProfileGuard {
  protected getOperator(): ProfileOperatorType {
    return ProfileOperator.AT_LEAST_ONE;
  }
}
