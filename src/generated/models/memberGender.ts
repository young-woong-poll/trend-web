export type MemberGender = (typeof MemberGender)[keyof typeof MemberGender];

export const MemberGender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
} as const;
