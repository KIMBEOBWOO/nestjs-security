import { Injectable } from '@nestjs/common';
import { ProfileOperator, ProfileOperatorType } from '../common';
import { BaseIpProfileGuard } from './base-ip-profile-guard';

@Injectable()
export class IpBlackListGuard extends BaseIpProfileGuard {
  protected getOperator(): ProfileOperatorType {
    return ProfileOperator.FOR_EVERY;
  }
}
