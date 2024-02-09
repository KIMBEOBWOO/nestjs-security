import { applyDecorators, Injectable, Type, UseGuards, UseInterceptors } from '@nestjs/common';
import { SetMetadata } from '@nestjs/common';
import { IpBlackListGuard, IpWhiteListGuard, SignedCSRFTokenGuard } from '../guards';
import { AddCsrfTokenToResponseHeaderInterceptor } from '../interceptors';
import { SecurityProfile } from '../interfaces';
import {
  IpWhiteListValidationSecurityProfile,
  IpBlackListValidationSecurityProfile,
  SignedCSRFTokenSecurityProfile,
} from '../providers';

type ProfileInputType<T = SecurityProfile> = Type<T>[];

/**
 * metadata key for AllowProfiles
 * - this metadata key is used to get security profiles from the controller or method context
 */
export const SECURITY_METADATA_KEY = '@nestj-security/security-metadata';
export const AllowProfiles = (...profiles: ProfileInputType) =>
  SetMetadata(SECURITY_METADATA_KEY, profiles);

export const Security = {
  /**
   * IP white list Security Decorator
   * @param profiles The security profiles that are allowed to access the resource
   * @link [IP White List](https://www.npmjs.com/package/nestjs-security)
   */
  CheckIpWhiteList: (...profiles: ProfileInputType<IpWhiteListValidationSecurityProfile>) =>
    applyDecorators(AllowProfiles(...profiles), UseGuards(IpWhiteListGuard)),
  /**
   * IP black list Security Decorator
   * @param profiles The security profiles that are deny to access the resource
   * @link [IP Black List](https://www.npmjs.com/package/nestjs-security)
   */
  CheckIpBlackList: (...profiles: ProfileInputType<IpBlackListValidationSecurityProfile>) =>
    applyDecorators(AllowProfiles(...profiles), UseGuards(IpBlackListGuard)),
  /**
   * Generate Signed CSRF Token Security Decorator
   * @param profiles The security profiles that are contain the rules for generating the CSRF token
   */
  GenSignedCSRFToken: (profile: Type<SignedCSRFTokenSecurityProfile>) =>
    applyDecorators(
      AllowProfiles(profile),
      /**
       * NOTE : I think you can set the response value to the header or the cookie
       */
      UseInterceptors(AddCsrfTokenToResponseHeaderInterceptor),
    ),
  /**
   * Check Signed CSRF Token Security Decorator
   * @param profiles The security profiles that are contain the rules for generating the CSRF token
   */
  CheckSignedCSRFToken: (...profiles: ProfileInputType<SignedCSRFTokenSecurityProfile>) =>
    applyDecorators(AllowProfiles(...profiles), UseGuards(SignedCSRFTokenGuard)),
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
