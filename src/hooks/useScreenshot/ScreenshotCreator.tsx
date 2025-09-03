import React from 'react';
import { useScreenshot } from '../../hooks/useScreenshot/useScreenshot';

interface ScreenshotCreatorProps {
  children: React.ReactNode;
  className?: string;
}

export const ScreenshotCreator: React.FC<ScreenshotCreatorProps> = ({ children, className = '' }) => {
  const { imageRef } = useScreenshot();
  return (
    <div ref={imageRef} className={`screenshot-creator ${className}`}>
      {children}
    </div>
  );
};