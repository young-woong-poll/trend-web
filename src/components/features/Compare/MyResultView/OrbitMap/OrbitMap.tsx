'use client';

import { useEffect, useMemo, useRef, useState, type FC } from 'react';

import {
  assignAngles,
  drawOrbitScene,
  generateStars,
  type OrbitCam,
  type OrbitMember,
  type OrbitStar,
} from '@/components/features/Compare/MyResultView/OrbitMap/orbit-draw';
import styles from '@/components/features/Compare/MyResultView/OrbitMap/OrbitMap.module.scss';

export interface OrbitMapProps {
  members: OrbitMember[];
  myNickname: string;
  isMember: boolean;
  onMemberTap?: (userId: string) => void;
}

export const OrbitMap: FC<OrbitMapProps> = ({ members, myNickname, isMember, onMemberTap }) => {
  void onMemberTap; // Task 6에서 탭 인터랙션 연결 시 소비

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderError, setRenderError] = useState(false);

  const stars = useMemo<OrbitStar[]>(() => generateStars(220), []);
  const memberAngles = useMemo(() => assignAngles(members), [members]);
  const camRef = useRef<OrbitCam>({ x: 0, y: 0, scale: 1 });
  const rotationRef = useRef(0);
  const selectedRef = useRef<string | null>(null);
  const nodeHitBoxesRef = useRef<Map<string, { x: number; y: number; r: number }>>(new Map());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setRenderError(true);
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const fit = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };
    fit();
    window.addEventListener('resize', fit);

    let rafId = 0;
    const loop = () => {
      try {
        drawOrbitScene({
          ctx,
          width: canvas.width,
          height: canvas.height,
          dpr,
          cam: camRef.current,
          stars,
          members,
          myNickname,
          rotation: rotationRef.current,
          selectedUserId: selectedRef.current,
          memberAngles,
          isMember,
          nodeHitBoxes: nodeHitBoxesRef.current,
        });
      } catch (err) {
        console.error('[OrbitMap] draw failed', err);
        setRenderError(true);
        return; // 다음 프레임 스케줄 안 함 — 폴백 이미지로 전환
      }
      rotationRef.current += 0.0008;
      rafId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', fit);
    };
  }, [stars, members, memberAngles, myNickname, isMember]);

  if (renderError) {
    return (
      <div className={styles.fallback} aria-label="궤도 정적 이미지">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/orbit-fallback.svg" alt="" />
      </div>
    );
  }

  return (
    <div className={styles.wrap} aria-label="나의 위치 궤도">
      <canvas ref={canvasRef} className={styles.canvas} />
      <div className={styles.hudTop} aria-hidden="true">
        <span className={styles.hudLeft}>VOYAGER 1 / {myNickname}</span>
      </div>
    </div>
  );
};
