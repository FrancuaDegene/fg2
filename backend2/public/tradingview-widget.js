// Функция для обновления виджета TradingView
function updateTradingViewWidget(symbol) {
  // Определение элемента, в который будет вставлен виджет
  const tradingViewContainer = document.getElementById('tradingViewContainer');

  // Очистка контейнера перед вставкой нового виджета
  tradingViewContainer.innerHTML = '';

  // Добавляем заголовок "График" перед виджетом TradingView
  const chartHeader = document.createElement('h2');
  chartHeader.textContent = 'График';
  tradingViewContainer.appendChild(chartHeader);

  // Создание нового элемента для виджета TradingView
  const tradingViewWidget = document.createElement('div');
  tradingViewWidget.className = 'tradingview-widget-container';
  tradingViewWidget.style = 'height: 500px; width: 100%;';

  // Вставка виджета в элемент
  tradingViewContainer.appendChild(tradingViewWidget);

  // Создание и вставка скрипта с настройками нового виджета
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.async = true;
  script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js';
  script.innerHTML = `
    {
      "symbols": [
        [
          "${symbol}|1D"
        ]
      ],
      "chartOnly": false,
      "width": 1000,
      "height": 500,
      "locale": "ru",
      "colorTheme": "light",
      "autosize": false,
      "showVolume": false,
      "showMA": false,
      "hideDateRanges": false,
      "hideMarketStatus": false,
      "hideSymbolLogo": false,
      "scalePosition": "right",
      "scaleMode": "Normal",
      "fontFamily": "-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif",
      "fontSize": "10",
      "noTimeScale": false,
      "valuesTracking": "1",
      "changeMode": "price-and-percent",
      "chartType": "area",
      "maLineColor": "#2962FF",
      "maLineWidth": 1,
      "maLength": 9,
      "lineWidth": 2,
      "lineType": 0,
      "dateRanges": [
        "1d|1",
        "1m|30",
        "3m|60",
        "12m|1D",
        "60m|1W",
        "all|1M"
      ]
    }
  `;

  // Вставка скрипта в элемент
  tradingViewWidget.appendChild(script);
}

