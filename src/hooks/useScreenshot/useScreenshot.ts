import { useRef, useState } from 'react';
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

interface HtmlUploadResponse {
  success: boolean;
  id?: string;
  message?: string;
}

export const useScreenshot = () => {
  const imageRef = useRef<HTMLDivElement>(null);
  const shareImageReady = useStoreScreenShot((store) => store.shareImageReady);
  const setShareImageReady = useStoreScreenShot((store) => store.setShareImageReady);
  const baseUrl = quranApi.defaults.baseURL;
  const [loading, setLoading] = useState<boolean>(false);

  // Функция для генерации HTML контента со стилями
  const generateHtmlContent = (): string => {
    if (!imageRef.current) return '';

    // Создаем HTML с инлайн стилями
    return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>История чата</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .chat-container {
            max-width: 390px;
            width: 100%;
            background: white;
            border-radius: 20px;
            padding: 20px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }
        
        .message {
            margin-bottom: 15px;
            padding: 12px 16px;
            border-radius: 18px;
            line-height: 1.4;
            word-wrap: break-word;
        }
        
        .user-message {
            background: #007AFF;
            color: white;
            margin-left: 60px;
            border-bottom-right-radius: 4px;
        }
        
        .bot-message {
            background: #E8E8ED;
            color: #000;
            margin-right: 60px;
            border-bottom-left-radius: 4px;
        }
        
        .nickname {
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 4px;
            opacity: 0.8;
        }
        
        .timestamp {
            font-size: 11px;
            text-align: right;
            margin-top: 5px;
            opacity: 0.6;
        }
    </style>
</head>
<body>
    <div class="chat-container">
        ${imageRef.current.innerHTML}
    </div>
</body>
</html>
    `;
  };

  // Функция для загрузки HTML файла на сервер
  const uploadHtmlFile = async (htmlContent: string, filename: string): Promise<string> => {
    try {
      // Создаем Blob из HTML контента
      const blob = new Blob([htmlContent], { type: 'text/html' });
      
      // Создаем FormData и добавляем файл
      const formData = new FormData();
      formData.append('htmlFile', blob, filename);
      formData.append('type', 'chat_history');

      const response = await quranApi.post<HtmlUploadResponse>(
        '/api/v1/qa/scanner/scan',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (response.data.success && response.data.id) {
        return response.data.id;
      } else {
        throw new Error(response.data.message || 'Failed to upload HTML file');
      }
    } catch (error) {
      console.error('HTML upload error:', error);
      throw error;
    }
  };

  const createScreenshot = async (): Promise<string> => {
    if (!imageRef.current) throw new Error('No element to capture');
    setLoading(true);
    try {
      if (!shareImageReady) {
        await toJpeg(imageRef.current, { quality: 0.05 });
        setShareImageReady();
      }

      const dataUrl = await toJpeg(imageRef.current, { quality: 0.95 });
      const res = await fetch(dataUrl);
      const blob = await res.blob();

      const formData = new FormData();
      formData.append('files', blob, 'story-screenshot.jpg');

      const uploadRes = await quranApi.post<Media[]>('/api/upload', formData);
      setLoading(false);
      return `${baseUrl}${uploadRes.data[0].url}`;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  // Новая функция для создания и отправки HTML
  const createAndUploadHtml = async (): Promise<string> => {
    if (!imageRef.current) throw new Error('No element to capture');
    setLoading(true);

    try {
      // Генерируем HTML контент
      const htmlContent = generateHtmlContent();
      
      // Создаем имя файла с timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `chat-history-${timestamp}.html`;
      
      // Загружаем на сервер
      const fileUrl = await uploadHtmlFile(htmlContent, filename);
      
      setLoading(false);
      return fileUrl;
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
    createAndUploadHtml, // Добавляем новую функцию
    shareToTelegramStory 
  };
};