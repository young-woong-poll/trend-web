import styles from '@/components/features/Admin/AdminBundleDashboard/AdminBundleDashboard.module.scss';
import type { AdminCompareLink } from '@/types/admin-bundle';

interface CompareLinksTabProps {
  compareLinks: {
    totalCount: number;
    oneToOneCount: number;
    groupCount: number;
    activeGroupCount: number;
    links: AdminCompareLink[];
  };
}

function getLinkStatus(link: AdminCompareLink): { label: string; className: string } {
  if (link.type === 'ONE_TO_ONE') {
    return link.memberCount >= 2
      ? { label: '완료', className: styles.statusCompleted }
      : { label: '대기', className: styles.statusWaiting };
  }
  return link.isClosed
    ? { label: '닫힘', className: styles.statusClosed }
    : { label: '활성', className: styles.statusActive };
}

export default function CompareLinksTab({ compareLinks }: CompareLinksTabProps) {
  return (
    <div>
      <div className={styles.statCards}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{compareLinks.oneToOneCount}</div>
          <div className={styles.statLabel}>1:1 링크</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{compareLinks.groupCount}</div>
          <div className={styles.statLabel}>그룹 링크</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{compareLinks.activeGroupCount}</div>
          <div className={styles.statLabel}>활성 그룹</div>
        </div>
      </div>

      {compareLinks.links.length > 0 ? (
        <div className={styles.linkTableWrapper}>
          <table className={styles.linkTable}>
            <thead>
              <tr>
                <th>타입</th>
                <th>그룹명/생성자</th>
                <th>멤버</th>
                <th>상태</th>
                <th>생성일</th>
                <th>토큰</th>
              </tr>
            </thead>
            <tbody>
              {compareLinks.links.map((link) => {
                const status = getLinkStatus(link);
                return (
                  <tr key={link.token}>
                    <td>
                      <span
                        className={link.type === 'GROUP' ? styles.typeGroup : styles.typeOneToOne}
                      >
                        {link.type === 'GROUP' ? 'GROUP' : '1:1'}
                      </span>
                    </td>
                    <td>
                      {link.groupName ? (
                        <>
                          {link.groupName}{' '}
                          <span className={styles.creator}>({link.creatorNickname})</span>
                        </>
                      ) : (
                        link.creatorNickname
                      )}
                    </td>
                    <td>{link.memberCount}</td>
                    <td>
                      <span className={status.className}>{status.label}</span>
                    </td>
                    <td className={styles.dateCell}>
                      {new Date(link.createdAt).toLocaleDateString('ko-KR', {
                        month: '2-digit',
                        day: '2-digit',
                      })}
                    </td>
                    <td>
                      <code className={styles.tokenCell}>{link.token.slice(0, 8)}</code>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.emptyTab}>비교 링크가 없습니다.</div>
      )}
    </div>
  );
}
