import { Injectable } from '@nestjs/common';

@Injectable()
export abstract class BaseSecurityProfile {
  abstract getIPWhiteList(): string[];
}
