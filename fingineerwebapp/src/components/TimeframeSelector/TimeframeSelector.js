import PropTypes from 'prop-types';
import { CHART_CONFIG } from '../../constants';
import './TimeframeSelector.css';

// Используем централизованные константы
const timeframes = CHART_CONFIG.TIMEFRAMES;

// Компонент TimeframeSelector отображает кнопки для выбора таймфрейма
const TimeframeSelector = ({ currentTimeframe, onSelectTimeframe }) => {

  // Обработчик клика по кнопке таймфрейма
  const handleClick = (timeframeId) => {
    console.log('TimeframeSelector: Выбран таймфрейм:', timeframeId);
    // Вызываем функцию обратного вызова, переданную из родительского компонента (App)
    onSelectTimeframe(timeframeId);
  };

  return (
    <div className="timeframe-selector-container"> {/* Контейнер для кнопок */}
      {/* Маппим по массиву timeframes для создания кнопок */}
      {timeframes.map(tf => (
        <button
          key={tf.id} // Уникальный ключ для каждого элемента списка
          className={`timeframe-button ${tf.id === currentTimeframe ? 'active' : ''}`} // Добавляем класс 'active', если это текущий таймфрейм
          onClick={() => handleClick(tf.id)} // При клике вызываем handleClick с соответствующим ID таймфрейма
          disabled={tf.id === currentTimeframe} // Делаем текущую кнопку неактивной
        >
          {tf.label} {/* Отображаем более понятный текст */}
        </button>
      ))}
    </div>
  );
};

// Определение PropTypes для валидации пропсов
TimeframeSelector.propTypes = {
  currentTimeframe: PropTypes.string.isRequired, // Текущий выбранный таймфрейм (строка, обязательный)
  onSelectTimeframe: PropTypes.func.isRequired, // Функция для обработки выбора таймфрейма (функция, обязательный)
};

export default TimeframeSelector;