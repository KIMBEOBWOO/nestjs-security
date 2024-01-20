import { applyDecorators, Injectable, Type, UseGuards } from '@nestjs/common';
import { SetMetadata } from '@nestjs/common';
import { IPCheckGuard } from '../guards';

export const SECURITY_METADATA_KEY = '@nestj-security/security-metadata';
const AllowProfiles = (...profiles: Type<unknown>[]) =>
  SetMetadata(SECURITY_METADATA_KEY, profiles);

export const Security = {
  AllowProfiles: (...profiles: Type<unknown>[]) =>
    applyDecorators(AllowProfiles(...profiles), UseGuards(IPCheckGuard)),
} as const;

export const DEFULAT_SECURITY_PROFILE_NAME = '@nestj-security/default';
export const SECURITY_PROFILE_METADATA_KEY = '@nestj-security/security-profile-metadata';
const SetSecurityProfileMetadata = (name?: string) => {
  return function (target: any) {
    Reflect.defineMetadata(
      SECURITY_PROFILE_METADATA_KEY,
      name || DEFULAT_SECURITY_PROFILE_NAME,
      target,
    );
  };
};

export const SecurityProfileSchema = (name?: string) =>
  applyDecorators(Injectable(), SetSecurityProfileMetadata(name));