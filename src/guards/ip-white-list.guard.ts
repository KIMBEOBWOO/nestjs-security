import { Injectable } from '@nestjs/common';
import { ProfileOperatorType, ProfileOperator } from '../common';
import { BaseProfileGuard } from './base-profile-guard';

@Injectable()
export class IpWhiteListGuard extends BaseProfileGuard {
  protected getOperator(): ProfileOperatorType {
    return ProfileOperator.AT_LEAST_ONE;
  }
}
