'use client';

import { useState, useEffect } from 'react';

interface CountdownResult {
  isExpired: boolean;
  isUrgent: boolean;
  isImminent: boolean;
  daysLeft: number;
  displayText: string;
  hasDeadline: boolean;
}

const NO_DEADLINE: CountdownResult = {
  isExpired: false,
  isUrgent: false,
  isImminent: false,
  daysLeft: -1,
  displayText: '',
  hasDeadline: false,
};

function calcCountdown(deadline: string): CountdownResult {
  const now = new Date().getTime();
  const target = new Date(deadline).getTime();
  const diff = target - now;

  if (diff <= 0) {
    return {
      isExpired: true,
      isUrgent: false,
      isImminent: false,
      daysLeft: 0,
      displayText: '마감',
      hasDeadline: true,
    };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  const isUrgent = days < 1;
  const isImminent = days < 3;

  let displayText: string;
  if (isUrgent) {
    displayText = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  } else {
    displayText = `D-${days}`;
  }

  return {
    isExpired: false,
    isUrgent,
    isImminent,
    daysLeft: days,
    displayText,
    hasDeadline: true,
  };
}

export function useCountdown(deadline?: string): CountdownResult {
  const [result, setResult] = useState<CountdownResult>(() => {
    if (!deadline) {
      return NO_DEADLINE;
    }
    return calcCountdown(deadline);
  });

  useEffect(() => {
    if (!deadline) {
      setResult(NO_DEADLINE);
      return;
    }

    setResult(calcCountdown(deadline));

    const now = new Date().getTime();
    const target = new Date(deadline).getTime();
    const diff = target - now;

    // 이미 만료됨
    if (diff <= 0) {
      return;
    }

    // D-1 이내: 매초 갱신, 그 외: 매분 갱신
    const isUrgent = diff < 1000 * 60 * 60 * 24;
    const interval = setInterval(
      () => {
        setResult(calcCountdown(deadline));
      },
      isUrgent ? 1000 : 60000
    );

    return () => clearInterval(interval);
  }, [deadline]);

  return result;
}
