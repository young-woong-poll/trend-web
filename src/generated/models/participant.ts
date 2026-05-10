import type { Answer } from './answer';

export interface Participant {
  nickname?: string;
  displayName?: string;
  displayProfileColor?: string;
  isWithdrawn?: boolean;
  answers?: Answer[];
}
