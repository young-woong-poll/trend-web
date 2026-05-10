export type SignupRequestGender = (typeof SignupRequestGender)[keyof typeof SignupRequestGender];

export const SignupRequestGender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
} as const;
