import { applyDecorators, Injectable, Type, UseGuards, UseInterceptors } from '@nestjs/common';
import { SetMetadata } from '@nestjs/common';
import { IpBlackListGuard, IpWhiteListGuard } from '../guards';
import { AddCsrfTokenToResponseHeaderInterceptor } from '../interceptors';
import { SecurityProfile } from '../interfaces';
import {
  IpWhiteListValidationSecurityProfile,
  IpBlackListValidationSecurityProfile,
  SignedCSRFTokenSecurityProfile,
} from '../providers';

type ProfileInputType<T = SecurityProfile> = Type<T>[];

export const SECURITY_METADATA_KEY = '@nestj-security/security-metadata';
export const AllowProfiles = (...profiles: ProfileInputType) =>
  SetMetadata(SECURITY_METADATA_KEY, profiles);

export const Security = {
  CheckIpWhiteList: (...profiles: ProfileInputType<IpWhiteListValidationSecurityProfile>) =>
    applyDecorators(AllowProfiles(...profiles), UseGuards(IpWhiteListGuard)),
  CheckIpBlackList: (...profiles: ProfileInputType<IpBlackListValidationSecurityProfile>) =>
    applyDecorators(AllowProfiles(...profiles), UseGuards(IpBlackListGuard)),
  GenSignedCSRFToken: (profile: Type<SignedCSRFTokenSecurityProfile>) =>
    applyDecorators(
      AllowProfiles(profile),
      /**
       * NOTE : 여기서 응답값을 헤더에 할지 아니면 쿠키에 할지 설정하면 될듯
       */
      UseInterceptors(AddCsrfTokenToResponseHeaderInterceptor),
    ),
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
