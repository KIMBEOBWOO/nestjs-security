import { applyDecorators, Type } from '@nestjs/common';
import { SetMetadata } from '@nestjs/common';
import { BaseSecurityProfile } from './security-profile';

export const SECURITY_METADATA_KEY = '@nestj-security/security-metadata';
const AllowProfiles = (...profiles: Type<BaseSecurityProfile>[]) =>
  SetMetadata(SECURITY_METADATA_KEY, profiles);

export const Security = {
  AllowProfiles: (...profiles: Type<BaseSecurityProfile>[]) =>
    applyDecorators(AllowProfiles(...profiles)),
} as const;
