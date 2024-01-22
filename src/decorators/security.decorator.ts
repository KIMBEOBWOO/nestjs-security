import { applyDecorators, Injectable, Type, UseGuards } from '@nestjs/common';
import { SetMetadata } from '@nestjs/common';
import { IpWhiteListGuard } from '../guards';

type ProfileInputType = Type<unknown>[];

export const SECURITY_METADATA_KEY = '@nestj-security/security-metadata';
const AllowProfiles = (...profiles: ProfileInputType) =>
  SetMetadata(SECURITY_METADATA_KEY, profiles);

export const Security = {
  CheckIpWhiteList: (...profiles: ProfileInputType) =>
    applyDecorators(AllowProfiles(...profiles), UseGuards(IpWhiteListGuard)),
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
