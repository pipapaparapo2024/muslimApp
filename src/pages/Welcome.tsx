import { useTelegram } from '../hooks/useTelegram';
import { useNavigate } from 'react-router-dom';

export const Welcome = () => {
  const { tg } = useTelegram();
  const navigate = useNavigate();

  const handleStart = () => {
    tg.HapticFeedback.impactOccurred('light'); // Вибрация
    navigate('/home');
  };

  return (
    <div>
      <h1>Добро пожаловать!</h1>
      <button onClick={handleStart}>Начать</button>
    </div>
  );
};