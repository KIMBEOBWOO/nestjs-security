import { Injectable } from '@nestjs/common';
import { ProfileOperator, ProfileOperatorType } from '../common';
import { BaseProfileGuard } from './base-profile-guard';

@Injectable()
export class IpBlackListGuard extends BaseProfileGuard {
  protected getOperator(): ProfileOperatorType {
    return ProfileOperator.FOR_EVERY;
  }
}
