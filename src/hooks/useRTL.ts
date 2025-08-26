import { useEffect } from 'react';

export function useRTL(isRTL: boolean) {
  useEffect(() => {
    document.body.dir = isRTL ? 'rtl' : 'ltr';
    return () => {
      document.body.dir = 'ltr';
    };
  }, [isRTL]);
} 