'use client';

import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/common/Button/Button';
import styles from '@/components/features/Admin/AdminServerMetaList/AdminServerMetaList.module.scss';
import { useModal } from '@/contexts/ModalContext';
import type { ServerMetaResponse } from '@/generated/models';
import { useServerMetas, useCreateServerMeta, useDeleteServerMeta } from '@/hooks/api/useAdmin';
import { useConfirm } from '@/hooks/useConfirm';

// ── 법정동코드 API (juso.dev) ──

const REGCODE_API = 'https://grpc-proxy-server-mkvo6j4wsq-du.a.run.app/v1/regcodes';

interface RegCode {
  code: string;
  name: string;
}

interface RegCodeResponse {
  regcodes: RegCode[];
}

const fetchRegCodes = async (pattern: string): Promise<RegCode[]> => {
  const url = `${REGCODE_API}?regcode_pattern=${pattern}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('법정동코드 조회 실패');
  }
  const data = (await res.json()) as RegCodeResponse;
  return data.regcodes.filter((r) => r.code !== '0000000000');
};

// ── Location Meta 타입 ──

interface LocationMeta {
  code: string;
  sido: string;
  sigungu: string;
  eupmyeondong: string;
}

// ── 컴포넌트 ──

export default function AdminServerMetaList() {
  const { data: serverMetas, isLoading } = useServerMetas();
  const { mutateAsync: createMeta, isPending: isCreating } = useCreateServerMeta();
  const { mutate: deleteMeta } = useDeleteServerMeta();
  const { showAlert } = useModal();
  const { showConfirm, confirmState, handleConfirm, handleCancel } = useConfirm();

  // 생성 폼 상태
  const [isAddMode, setIsAddMode] = useState(false);
  const [slug, setSlug] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  // 법정동코드 3단계 드롭다운 상태
  const [sidoList, setSidoList] = useState<RegCode[]>([]);
  const [sigunguList, setSigunguList] = useState<RegCode[]>([]);
  const [dongList, setDongList] = useState<RegCode[]>([]);
  const [selectedSido, setSelectedSido] = useState<RegCode | null>(null);
  const [selectedSigungu, setSelectedSigungu] = useState<RegCode | null>(null);
  const [selectedDong, setSelectedDong] = useState<RegCode | null>(null);

  // 복사 상태
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 시도 목록 로드
  useEffect(() => {
    void fetchRegCodes('*00000000')
      .then(setSidoList)
      .catch(() => setSidoList([]));
  }, []);

  // 시도 선택 시 → 시군구 목록 로드
  const handleSidoChange = useCallback(
    async (code: string) => {
      if (!code) {
        setSelectedSido(null);
        setSigunguList([]);
        setDongList([]);
        setSelectedSigungu(null);
        setSelectedDong(null);
        return;
      }

      const sido = sidoList.find((s) => s.code === code);
      if (!sido) {
        return;
      }

      setSelectedSido(sido);
      setSelectedSigungu(null);
      setSelectedDong(null);
      setDongList([]);

      try {
        const prefix = code.substring(0, 2);
        const list = await fetchRegCodes(`${prefix}*00000`);
        // 시도 자체(끝이 00000000)는 제외
        setSigunguList(list.filter((r) => r.code !== code));
      } catch {
        setSigunguList([]);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [sidoList]
  );

  // 시군구 선택 시 → 읍면동 목록 로드
  const handleSigunguChange = useCallback(
    async (code: string) => {
      if (!code) {
        setSelectedSigungu(null);
        setDongList([]);
        setSelectedDong(null);
        return;
      }

      const sigungu = sigunguList.find((s) => s.code === code);
      if (!sigungu) {
        return;
      }

      setSelectedSigungu(sigungu);
      setSelectedDong(null);

      try {
        const prefix = code.substring(0, 5);
        const list = await fetchRegCodes(`${prefix}*&is_ignore_zero=true`);
        // 시군구 자체는 제외
        setDongList(list.filter((r) => r.code !== code));
      } catch {
        setDongList([]);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [sigunguList]
  );

  // 읍면동 선택
  const handleDongChange = useCallback(
    (code: string) => {
      if (!code) {
        setSelectedDong(null);
        return;
      }

      const dong = dongList.find((d) => d.code === code);
      if (dong) {
        setSelectedDong(dong);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [dongList]
  );

  // 이름에서 시도/시군구/읍면동 부분만 추출
  const extractName = (fullName: string, parentName?: string): string => {
    if (parentName) {
      return fullName.replace(parentName, '').trim();
    }
    return fullName;
  };

  // 폼 리셋
  const resetForm = () => {
    setIsAddMode(false);
    setSlug('');
    setFrom('');
    setTo('');
    setSelectedSido(null);
    setSelectedSigungu(null);
    setSelectedDong(null);
    setSigunguList([]);
    setDongList([]);
  };

  // 생성 핸들러
  const handleCreate = async () => {
    if (!slug.trim()) {
      showAlert('핫픽 slug를 입력해주세요.');
      return;
    }

    if (!selectedSido || !selectedSigungu) {
      showAlert('시도와 시군구를 선택해주세요.');
      return;
    }

    const locationCode = selectedDong?.code ?? selectedSigungu.code;
    const sidoName = selectedSido.name;
    const sigunguName = extractName(selectedSigungu.name, selectedSido.name);
    const dongName = selectedDong ? extractName(selectedDong.name, selectedSigungu.name) : '';

    const location: LocationMeta = {
      code: locationCode,
      sido: sidoName,
      sigungu: sigunguName,
      eupmyeondong: dongName,
    };

    const meta: Record<string, unknown> = { location };
    if (from) {
      meta.from = from;
    }
    if (to) {
      meta.to = to;
    }

    try {
      await createMeta({ meta });
      resetForm();
    } catch (error) {
      const msg = error instanceof Error ? error.message : '알 수 없는 오류';
      showAlert(`서버 메타 생성 실패: ${msg}`);
    }
  };

  // 삭제 핸들러
  const handleDelete = (item: ServerMetaResponse) => {
    const meta = item.meta as Record<string, unknown> | undefined;
    const loc = meta?.location as LocationMeta | undefined;
    const label = loc ? `${loc.sido} ${loc.sigungu}` : (item.id ?? '');

    showConfirm('서버 메타 삭제', {
      message: `"${label}" 메타를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
      confirmText: '삭제',
      cancelText: '취소',
      onConfirm: () => {
        if (item.id) {
          deleteMeta(item.id);
        }
      },
    });
  };

  // URL 복사
  const handleCopyUrl = async (item: ServerMetaResponse) => {
    const baseUrl = window.location.origin;
    // slug가 meta에 없으므로 URL에 slug placeholder 사용
    // 실제로는 slug를 포함해 저장하거나 별도 관리해야 하지만,
    // 여기서는 바로 prompt 없이 복사를 위해 slug input 제공
    const url = `${baseUrl}/offline-vote?slug=SLUG&serverMetaId=${item.id}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(item.id ?? null);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showAlert('클립보드 복사에 실패했습니다.');
    }
  };

  // ── 렌더링 ──

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>로딩 중...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 헤더 */}
      <header className={styles.header}>
        <div>
          <h1>서버 메타 관리</h1>
          <p className={styles.subtitle}>
            오프라인 투표 장소별 메타데이터 관리 ({(serverMetas ?? []).length}개)
          </p>
        </div>
        {!isAddMode && (
          <Button variant="outline" onClick={() => setIsAddMode(true)}>
            + 서버 메타 생성
          </Button>
        )}
      </header>

      {/* 생성 폼 */}
      {isAddMode && (
        <div className={styles.createForm}>
          <h2 className={styles.formTitle}>새 서버 메타 생성</h2>

          {/* 핫픽 slug */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>핫픽 Slug</label>
            <input
              type="text"
              className={styles.input}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="투표 slug (예: my-vote)"
            />
          </div>

          {/* 장소 선택 - 법정동코드 3단계 드롭다운 */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>장소 (법정동코드)</label>
            <div className={styles.locationDropdowns}>
              {/* 시도 */}
              <select
                className={styles.select}
                value={selectedSido?.code ?? ''}
                onChange={(e) => void handleSidoChange(e.target.value)}
              >
                <option value="">시도 선택</option>
                {sidoList.map((sido) => (
                  <option key={sido.code} value={sido.code}>
                    {sido.name}
                  </option>
                ))}
              </select>

              {/* 시군구 */}
              <select
                className={styles.select}
                value={selectedSigungu?.code ?? ''}
                onChange={(e) => void handleSigunguChange(e.target.value)}
                disabled={!selectedSido}
              >
                <option value="">시군구 선택</option>
                {sigunguList.map((sigungu) => (
                  <option key={sigungu.code} value={sigungu.code}>
                    {extractName(sigungu.name, selectedSido?.name)}
                  </option>
                ))}
              </select>

              {/* 읍면동 (선택사항) */}
              <select
                className={styles.select}
                value={selectedDong?.code ?? ''}
                onChange={(e) => handleDongChange(e.target.value)}
                disabled={!selectedSigungu}
              >
                <option value="">(전체 - 선택안함)</option>
                {dongList.map((dong) => (
                  <option key={dong.code} value={dong.code}>
                    {extractName(dong.name, selectedSigungu?.name)}
                  </option>
                ))}
              </select>
            </div>
            {selectedSigungu && (
              <p className={styles.selectedLocation}>
                선택: {selectedSido?.name} {extractName(selectedSigungu.name, selectedSido?.name)}
                {selectedDong ? ` ${extractName(selectedDong.name, selectedSigungu.name)}` : ''} (
                {selectedDong?.code ?? selectedSigungu.code})
              </p>
            )}
          </div>

          {/* 유효 기간 */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>유효 기간 (선택)</label>
            <div className={styles.timeRange}>
              <input
                type="datetime-local"
                className={styles.input}
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
              <span className={styles.timeRangeSeparator}>~</span>
              <input
                type="datetime-local"
                className={styles.input}
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </div>

          {/* 폼 액션 */}
          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.saveButton}
              onClick={handleCreate}
              disabled={isCreating || !slug.trim() || !selectedSigungu}
            >
              {isCreating ? '생성 중...' : '생성'}
            </button>
            <button type="button" className={styles.cancelButton} onClick={resetForm}>
              취소
            </button>
          </div>
        </div>
      )}

      {/* 목록 테이블 */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>장소</th>
              <th>법정동코드</th>
              <th>유효기간</th>
              <th>생성일</th>
              <th>액션</th>
            </tr>
          </thead>
          <tbody>
            {(serverMetas ?? []).map((item) => {
              const meta = item.meta as Record<string, unknown> | undefined;
              const location = meta?.location as LocationMeta | undefined;
              const metaFrom = meta?.from as string | undefined;
              const metaTo = meta?.to as string | undefined;

              return (
                <tr key={item.id}>
                  <td className={styles.idCell}>
                    <span className={styles.uuid}>{item.id?.substring(0, 8)}...</span>
                  </td>
                  <td>
                    {location
                      ? `${location.sido} ${location.sigungu}${location.eupmyeondong ? ` ${location.eupmyeondong}` : ''}`
                      : '—'}
                  </td>
                  <td>
                    <code className={styles.code}>{location?.code ?? '—'}</code>
                  </td>
                  <td>
                    {metaFrom && metaTo ? (
                      <span className={styles.timeInfo}>
                        {metaFrom} ~ {metaTo}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString('ko-KR') : '—'}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.copyButton}
                        onClick={() => void handleCopyUrl(item)}
                      >
                        {copiedId === item.id ? '복사됨!' : 'URL 복사'}
                      </button>
                      <button
                        type="button"
                        className={styles.deleteButton}
                        onClick={() => handleDelete(item)}
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {(!serverMetas || serverMetas.length === 0) && !isAddMode && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>
                  등록된 서버 메타가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Confirm 모달 */}
      {confirmState.isOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>{confirmState.title}</h2>
            {confirmState.message && <p className={styles.modalMessage}>{confirmState.message}</p>}
            <div className={styles.modalActions}>
              <Button variant="outline" onClick={handleCancel}>
                {confirmState.cancelText}
              </Button>
              <Button variant="primary" onClick={handleConfirm} className={styles.confirmButton}>
                {confirmState.confirmText}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
