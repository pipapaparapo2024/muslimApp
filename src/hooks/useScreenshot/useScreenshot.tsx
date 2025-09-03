import React, { useRef, useState } from 'react';
import { toJpeg } from 'html-to-image';
import { quranApi } from '../../api/api';
import { useStoreScreenShot } from './useStoreScreenShot';
import { shareStory } from '@telegram-apps/sdk';

interface Format {
  url: string;
  width?: number;
  height?: number;
}
interface Media {
  id: number;
  url: string;
  formats?: Format;
}

export const useScreenshot = () => {
  const imageRef = useRef<HTMLDivElement>(null);
  const shareImageReady = useStoreScreenShot((store) => store.shareImageReady);
  const setShareImageReady = useStoreScreenShot((store) => store.setShareImageReady);
  const baseUrl = quranApi.defaults.baseURL;
  const [loading, setLoading] = useState<boolean>(false);

  const createScreenshot = async (): Promise<string> => {
    if (!imageRef.current) throw new Error('No element to capture');

    setLoading(true);
    try {
      if (!shareImageReady) {
        await toJpeg(imageRef.current, {
          quality: 0.05,
          cacheBust: false,
        });
        setShareImageReady();
      }

      const dataUrl = await toJpeg(imageRef.current, {
        quality: 0.95,
        cacheBust: false,
      });

      const res = await fetch(dataUrl);
      const blob = await res.blob();

      const formData = new FormData();
      formData.append('files', blob, 'story-screenshot.jpg');

      const uploadRes = await quranApi.post<Media[]>('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setLoading(false);
      return baseUrl + uploadRes.data[0].url;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const shareToTelegramStory = (imageUrl: string) => {
    if (shareStory.isAvailable()) {
      shareStory(imageUrl, {
        widgetLink: {
          url: 'https://t.me/SerhioFirstBot',
          name: '@SerhioFirstBot',
        },
      });
    }
  };

  return {
    imageRef,
    loading,
    createScreenshot,
    shareToTelegramStory,
  };
};

interface ScreenshotCreatorProps {
  children: React.ReactNode;
  className?: string;
}

export const ScreenshotCreator: React.FC<ScreenshotCreatorProps> = ({
  children,
  className = '',
}) => {
  const { imageRef } = useScreenshot();

  return (
    <div ref={imageRef} className={`screenshot-creator ${className}`}>
      {children}
    </div>
  );
};