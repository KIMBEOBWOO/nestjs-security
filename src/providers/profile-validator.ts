import { Injectable } from '@nestjs/common';
import { ProfileOperator, ProfileOperatorType } from '../common';
import { InvalidProfileOperatorError } from '../exceptions';
import { SecurityProfile } from '../interfaces';

@Injectable()
export class ProfileValidator {
  static async applyProfiles(
    profiles: SecurityProfile[],
    operator: ProfileOperatorType,
    ...profileValidateArguments: unknown[]
  ): Promise<boolean> {
    const validateResults = await Promise.all(
      profiles.map((profile) => profile.validate(...profileValidateArguments)),
    );

    switch (operator) {
      case ProfileOperator.AT_LEAST_ONE:
        for (const result of validateResults) {
          if (result === true) return true;
        }
        return false;

      case ProfileOperator.FOR_EVERY:
        return validateResults.every((result) => result === true);

      default:
        throw new InvalidProfileOperatorError(operator);
    }
  }
}
