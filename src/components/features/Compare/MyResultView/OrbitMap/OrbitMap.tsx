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
import {
  dismissOrbitHint,
  wasOrbitHintDismissed,
} from '@/components/features/Compare/MyResultView/OrbitMap/orbit-hint';
import styles from '@/components/features/Compare/MyResultView/OrbitMap/OrbitMap.module.scss';

export interface OrbitMapProps {
  members: OrbitMember[];
  myNickname: string;
  isMember: boolean;
  onMemberTap?: (userId: string) => void;
}

export const OrbitMap: FC<OrbitMapProps> = ({ members, myNickname, isMember, onMemberTap }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderError, setRenderError] = useState(false);
  const [hintVisible, setHintVisible] = useState(() => !wasOrbitHintDismissed());

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const zoomAtScreenCenter = (factor: number) => {
      const prev = camRef.current.scale;
      const nextScale = Math.max(0.5, Math.min(2.5, prev * factor));
      const realFactor = nextScale / prev;
      camRef.current = {
        x: camRef.current.x * realFactor,
        y: camRef.current.y * realFactor,
        scale: nextScale,
      };
    };

    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let pointerStart: { x: number; y: number } | null = null;

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      pointerStart = { x: e.clientX, y: e.clientY };
      canvas.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) {
        return;
      }
      camRef.current = {
        ...camRef.current,
        x: camRef.current.x + (e.clientX - lastX) * dpr,
        y: camRef.current.y + (e.clientY - lastY) * dpr,
      };
      lastX = e.clientX;
      lastY = e.clientY;
    };

    const onPointerUp = (e: PointerEvent) => {
      dragging = false;
      if (pointerStart && Math.hypot(e.clientX - pointerStart.x, e.clientY - pointerStart.y) < 6) {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * dpr;
        const y = (e.clientY - rect.top) * dpr;
        for (const [userId, box] of nodeHitBoxesRef.current) {
          if (Math.hypot(x - box.x, y - box.y) < box.r + 6 * dpr) {
            selectedRef.current = userId;
            onMemberTap?.(userId);
            return;
          }
        }
        selectedRef.current = null;
      }
    };

    let pinchStart: { dist: number; scale: number; camX: number; camY: number } | null = null;
    const pinchDist = (t: TouchList) =>
      Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinchStart = {
          dist: pinchDist(e.touches),
          scale: camRef.current.scale,
          camX: camRef.current.x,
          camY: camRef.current.y,
        };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchStart) {
        e.preventDefault();
        const d = pinchDist(e.touches);
        const targetScale = Math.max(0.5, Math.min(2.5, pinchStart.scale * (d / pinchStart.dist)));
        const factor = targetScale / pinchStart.scale;
        camRef.current = {
          scale: targetScale,
          x: pinchStart.camX * factor,
          y: pinchStart.camY * factor,
        };
      }
    };

    const onTouchEnd = () => {
      pinchStart = null;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomAtScreenCenter(e.deltaY < 0 ? 1.08 : 0.92);
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('touchstart', onTouchStart);
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      canvas.removeEventListener('wheel', onWheel);
    };
  }, [onMemberTap]);

  const zoom = (factor: number) => {
    const prev = camRef.current.scale;
    const nextScale = Math.max(0.5, Math.min(2.5, prev * factor));
    const realFactor = nextScale / prev;
    camRef.current = {
      x: camRef.current.x * realFactor,
      y: camRef.current.y * realFactor,
      scale: nextScale,
    };
  };

  const reset = () => {
    camRef.current = { x: 0, y: 0, scale: 1 };
  };

  const handleHintDismiss = () => {
    dismissOrbitHint();
    setHintVisible(false);
  };

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
      <div className={styles.controls} aria-label="궤도 조작">
        <button type="button" onClick={() => zoom(1.2)} aria-label="확대">
          +
        </button>
        <button type="button" onClick={() => zoom(0.833)} aria-label="축소">
          −
        </button>
        <button type="button" onClick={reset} aria-label="원위치">
          ↻
        </button>
      </div>
      {hintVisible && (
        <button
          type="button"
          className={styles.hudHint}
          onClick={handleHintDismiss}
          aria-label="힌트 닫기"
        >
          탭해서 자세히 보기
        </button>
      )}
    </div>
  );
};
