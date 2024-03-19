import { Injectable } from '@nestjs/common';
import { ProfileOperator, ProfileOperatorType } from '../common';
import { IpProfileGuard } from './ip-profile-guard';

@Injectable()
export class IpBlackListGuard extends IpProfileGuard {
  protected getOperator(): ProfileOperatorType {
    return ProfileOperator.FOR_EVERY;
  }
}
