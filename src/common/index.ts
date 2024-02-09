export const ProfileOperator = {
  AT_LEAST_ONE: 'at-least-one',
  FOR_EVERY: 'for-every',
} as const;

export type ProfileOperatorType = (typeof ProfileOperator)[keyof typeof ProfileOperator];

export const CSRF_TOKEN_HEADER = 'x-csrf-token';
