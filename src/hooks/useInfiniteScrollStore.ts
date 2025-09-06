import { useEffect, useRef, useCallback } from 'react';

export const useInfiniteScroll = (onLoadMore: () => void, options = {}) => {
  const observer = useRef<IntersectionObserver>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  const handleIntersect = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting) {
      onLoadMore();
    }
  }, [onLoadMore]);

  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;

    observer.current = new IntersectionObserver(handleIntersect, {
      root: null,
      rootMargin: '100px',
      threshold: 0.1,
      ...options,
    });

    observer.current.observe(target);

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [handleIntersect, options]);

  return { observerTarget };
};