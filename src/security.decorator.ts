import { applyDecorators, Type, UseGuards } from '@nestjs/common';
import { SetMetadata } from '@nestjs/common';
import { IPCheckGuard } from './ip-check.guard';

export const SECURITY_METADATA_KEY = '@nestj-security/security-metadata';
const AllowProfiles = (...profiles: Type<unknown>[]) =>
  SetMetadata(SECURITY_METADATA_KEY, profiles);

export const Security = {
  AllowProfiles: (...profiles: Type<unknown>[]) =>
    applyDecorators(AllowProfiles(...profiles), UseGuards(IPCheckGuard)),
} as const;
