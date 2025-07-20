import { useTelegram } from '../hooks/useTelegram';
import { Link } from 'react-router-dom';

export const Home = () => {
  const { tg } = useTelegram();

  return (
    <div>
      <h2>Главное меню</h2>
      <nav>
        <Link to="/quran" onClick={() => tg.HapticFeedback.impactOccurred('soft')}>
          Чтение Корана
        </Link>
        <Link to="/scanner" onClick={() => tg.HapticFeedback.impactOccurred('soft')}>
          Сканер продуктов
        </Link>
        {/* Остальные кнопки */}
      </nav>
    </div>
  );
};