import type { Answer } from './answer';
import type { MemberGender } from './memberGender';

export interface Member {
  userId?: string;
  nickname?: string;
  displayName?: string;
  displayProfileColor?: string;
  gender?: MemberGender;
  isWithdrawn?: boolean;
  answers?: Answer[];
}
