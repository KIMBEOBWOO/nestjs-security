import { Injectable } from '@nestjs/common';
import { ProfileOperatorType, ProfileOperator } from '../common';
import { IpProfileGuard } from './ip-profile-guard';

@Injectable()
export class IpWhiteListGuard extends IpProfileGuard {
  protected getOperator(): ProfileOperatorType {
    return ProfileOperator.AT_LEAST_ONE;
  }
}
