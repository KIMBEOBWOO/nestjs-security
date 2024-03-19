import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Type,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ProfileOperatorType } from '../common';
import { SECURITY_METADATA_KEY } from '../decorators';
import { ProfileValidationInfoDefinedByMiddleware } from '../interfaces';
import { ProfileStorage, ProfileValidator } from '../providers';

@Injectable()
export abstract class ProfileGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly profileStorage: ProfileStorage,
  ) {}

  async canActivate(context: ExecutionContext) {
    const requiredProfileNames = this.getRequiredProfileNames(context);
    // If there is no requiredProfiles, it means that the request is not decorated with @SetSecurityProfile.
    if (!requiredProfileNames || requiredProfileNames.length === 0) {
      return true;
    }
    const requiredProfiles = this.profileStorage.getProfile(requiredProfileNames);

    // Execute the validate method of the requiredProfiles.
    const profileArguments = this.getProfileArguments(context);
    const isValid = await ProfileValidator.applyProfiles(
      requiredProfiles,
      this.getOperator(),
      ...profileArguments,
    );

    return this.validate({
      profileValidationResult: isValid,
      requiredProfileNames,
      profileArguments,
    });
  }

  /**
   * Get the operator type of the requiredProfiles.
   * @returns {ProfileOperatorType} The operator type of the requiredProfiles.
   * ProfileOperatorType is used to aggregate the results of each profile to determine the final result.
   *  - e.g. if you want to allow the request if at least one of the requiredProfiles is valid, return ProfileOperator.AT_LEAST_ONE
   *  - e.g. if you want to allow the request if all of the requiredProfiles are valid, return ProfileOperator.FOR_EVERY
   */
  protected abstract getOperator(): ProfileOperatorType;

  /**
   * Get the arguments for the profile validation.
   * @param context The execution context.
   * should implement this method to get the arguments for the profile validation.
   *  - e.g. if you want ip address, you can get it from the request object and return it.
   *  - e.g. if you want user id, you can get it from the request object and return it
   */
  protected abstract getProfileArguments(context: ExecutionContext): unknown[];

  /**
   * Validate the profileValidationResult.
   * @param validationInfo.profileValidationResult The result of the profile validation.
   * @param validationInfo.requiredProfileNames The requiredProfiles name.
   * @param validationInfo.profileArguments The arguments for the profile validation.
   * @returns {boolean} The result of the profile validation.
   * @throws {ForbiddenException} If the profileValidationResult is false.
   *
   * profileValidationResult is original result of the profile validation, but you can modify the result.
   *  - e.g. if you want to throw the custom exception, you can throw the custom exception.
   */
  protected validate(validationInfo: ProfileValidationInfoDefinedByMiddleware): boolean {
    if (validationInfo.profileValidationResult) {
      return true;
    } else {
      throw new ForbiddenException();
    }
  }

  /**
   * Get the requiredProfiles from the context.
   * @param context The execution context.
   * @returns {string[]} The requiredProfiles name.
   */
  private getRequiredProfileNames(context: ExecutionContext): string[] | undefined {
    return this.reflector
      .getAllAndOverride<Type<any>[] | undefined>(SECURITY_METADATA_KEY, [
        context.getHandler(),
        context.getClass(),
      ])
      ?.map((profile) => profile.name);
  }
}
