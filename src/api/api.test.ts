import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import WebApp from '@twa-dev/sdk';

let quranApi: any;

// Мокаем WebApp
vi.mock('@twa-dev/sdk', () => ({
  default: {
    initData: 'test-init-data',
  },
}));

// Мокаем аналитику
vi.mock('./analytics', () => ({
  trackButtonClick: vi.fn(),
}));

// Мокаем глобальные объекты
const mockShowAlert = vi.fn();
const mockClose = vi.fn();

// В jsdom/happy-dom localStorage уже есть, просто мокаем методы если нужно следить за вызовами
vi.spyOn(localStorage, 'getItem');
vi.spyOn(localStorage, 'setItem');
vi.spyOn(localStorage, 'removeItem');

vi.stubGlobal('window', {
  ...window,
  Telegram: {
    WebApp: {
      showAlert: mockShowAlert,
      close: mockClose,
    },
  },
});

describe('quranApi interceptors', () => {
  let mock: MockAdapter;

  beforeEach(async () => {
    // Используем переменные для подавления ворнингов linter-а
    expect(axios).toBeDefined();
    expect(WebApp).toBeDefined();

    vi.resetModules();
    const apiModule = await import('./api');
    quranApi = apiModule.quranApi;
    mock = new MockAdapter(quranApi);
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    mock.restore();
  });

  it('should refresh token successfully via refresh endpoint on 401', async () => {
    const originalToken = 'old-token';
    const newToken = 'new-token';
    
    localStorage.setItem('accessToken', originalToken);

    // 1. Первый запрос падает с 401
    mock.onGet('/test').replyOnce(401);
    
    // 2. Запрос на refresh проходит успешно
    mock.onPost('/api/v1/user/auth/refresh').reply(200, {
      data: { accessToken: newToken }
    });

    // 3. Повторный запрос проходит успешно
    mock.onGet('/test').reply(200, { success: true });

    const response = await quranApi.get('/test');

    expect(response.data.success).toBe(true);
    expect(localStorage.setItem).toHaveBeenCalledWith('accessToken', newToken);
    // Проверяем, что заголовок обновился
    expect(response.config.headers.Authorization).toBe(`Bearer ${newToken}`);
  });

  it('should perform full re-auth via /user/auth/ if refresh fails', async () => {
    const newToken = 'reauth-token';

    // 1. Первый запрос падает с 401
    mock.onGet('/test').replyOnce(401);
    
    // 2. Refresh падает с 403 (например, refresh token протух)
    mock.onPost('/api/v1/user/auth/refresh').reply(403);

    // 3. Запрос на полную авторизацию проходит успешно
    mock.onPost('/api/v1/user/auth/').reply(200, {
      data: { accessToken: newToken }
    });

    // 4. Повторный исходный запрос проходит успешно
    mock.onGet('/test').reply(200, { success: true });

    const response = await quranApi.get('/test');

    expect(response.data.success).toBe(true);
    expect(localStorage.setItem).toHaveBeenCalledWith('accessToken', newToken);
  });

  it('should stop and fail if both refresh and re-auth fail', async () => {
    // 1. Первый запрос падает с 401
    mock.onGet('/test').replyOnce(401);
    
    // 2. Refresh падает
    mock.onPost('/api/v1/user/auth/refresh').reply(403);

    // 3. Re-auth падает
    mock.onPost('/api/v1/user/auth/').reply(401);

    await expect(quranApi.get('/test')).rejects.toThrow();
    
    expect(mockShowAlert).toHaveBeenCalledWith("Сессия истекла. Пожалуйста, перезапустите приложение.");
    expect(localStorage.removeItem).toHaveBeenCalledWith('accessToken');
  });

  it('should handle 5+ concurrent requests and queue them correctly', async () => {
    const newToken = 'super-token';
    const requestCount = 7;
    const paths = Array.from({ length: requestCount }, (_, i) => `/test${i}`);

    // 1. Все запросы падают с 401
    paths.forEach(path => mock.onGet(path).replyOnce(401));
    
    // 2. Refresh проходит успешно (с задержкой)
    mock.onPost('/api/v1/user/auth/refresh').reply(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
      return [200, { data: { accessToken: newToken } }];
    });

    // 3. Повторные запросы проходят успешно
    paths.forEach((path, i) => mock.onGet(path).reply(200, { data: i }));

    const results = await Promise.all(paths.map(path => quranApi.get(path)));

    results.forEach((res, i) => {
      expect(res.data.data).toBe(i);
      expect(res.config.headers.Authorization).toBe(`Bearer ${newToken}`);
    });

    // Проверяем, что refresh вызвался только ОДИН раз
    expect(mock.history.post.filter(r => r.url === '/api/v1/user/auth/refresh').length).toBe(1);
  });

  it('should retry refresh up to 3 times before trying auth', async () => {
    const newToken = 'auth-token';

    mock.onGet('/test').replyOnce(401);
    
    // 3 неудачных refresh
    mock.onPost('/api/v1/user/auth/refresh').reply(403); 
    
    // Успешный auth
    mock.onPost('/api/v1/user/auth/').reply(200, {
      data: { accessToken: newToken }
    });

    mock.onGet('/test').reply(200, { success: true });

    const response = await quranApi.get('/test');

    expect(response.data.success).toBe(true);
    // 3 попытки refresh + 1 auth
    expect(mock.history.post.filter(r => r.url === '/api/v1/user/auth/refresh').length).toBe(3);
    expect(mock.history.post.filter(r => r.url === '/api/v1/user/auth/').length).toBe(1);
  });

  it('should fail if auth fails after refresh failures', async () => {
    mock.onGet('/test').replyOnce(401);
    mock.onPost('/api/v1/user/auth/refresh').reply(403);
    mock.onPost('/api/v1/user/auth/').reply(401);

    await expect(quranApi.get('/test')).rejects.toThrow();
    
    expect(mockShowAlert).toHaveBeenCalled();
  });
});
