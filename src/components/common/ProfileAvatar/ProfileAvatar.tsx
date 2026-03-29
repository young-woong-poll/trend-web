import type { FC } from 'react';

import styles from '@/components/common/ProfileAvatar/ProfileAvatar.module.scss';
import { getProfileGradient } from '@/constants/profileColors';

interface ProfileAvatarProps {
  nickname: string | null;
  profileColor: string;
  size?: number;
}

const ProfileAvatar: FC<ProfileAvatarProps> = ({ nickname, profileColor, size = 72 }) => {
  const initial = nickname ? nickname.charAt(0) : 'USER';
  const fontSize = Math.round(size * 0.38);

  return (
    <div
      className={styles.avatar}
      style={{
        width: size,
        height: size,
        background: getProfileGradient(profileColor),
        fontSize,
      }}
    >
      <span className={styles.initial}>{initial}</span>
    </div>
  );
};

export default ProfileAvatar;
