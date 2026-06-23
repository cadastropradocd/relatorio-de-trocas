import { useState, useRef, useEffect } from 'react';

interface UsePullToRefreshResult {
  pullDistance: number;
  isRefreshing: boolean;
}

export function usePullToRefresh(
  elementRef: React.RefObject<HTMLDivElement | null>,
  onRefresh: () => Promise<void> | void,
  threshold = 60,
  disabled = false
): UsePullToRefreshResult {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const startYRef = useRef(0);
  const isPullingRef = useRef(false);
  const refreshingRef = useRef(false);
  const pullDistanceRef = useRef(0);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    const el = elementRef.current;
    if (!el || disabled) return;

    const handleTouchStart = (e: TouchEvent): void => {
      if (refreshingRef.current) return;
      if (window.scrollY > 0) return;
      startYRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
    };

    const handleTouchMove = (e: TouchEvent): void => {
      if (!isPullingRef.current) return;
      const diff = e.touches[0].clientY - startYRef.current;
      if (diff <= 0) {
        pullDistanceRef.current = 0;
        setPullDistance(0);
        isPullingRef.current = false;
        return;
      }
      pullDistanceRef.current = Math.min(diff * 0.4, 120);
      setPullDistance(pullDistanceRef.current);
    };

    const handleTouchEnd = async (): Promise<void> => {
      if (!isPullingRef.current) return;
      isPullingRef.current = false;

      if (pullDistanceRef.current >= threshold) {
        refreshingRef.current = true;
        setIsRefreshing(true);
        try {
          await onRefreshRef.current();
        } finally {
          refreshingRef.current = false;
          setIsRefreshing(false);
          pullDistanceRef.current = 0;
          setPullDistance(0);
        }
      } else {
        pullDistanceRef.current = 0;
        setPullDistance(0);
      }
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: true });
    el.addEventListener('touchend', handleTouchEnd);

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [elementRef, disabled, threshold]);

  return { pullDistance, isRefreshing };
}
