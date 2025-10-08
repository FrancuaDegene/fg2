// Функция для загрузки виджета бегущей строки
function loadTickerTapeWidget() {
  const tickerTapeContainer = document.createElement('div');
  tickerTapeContainer.className = 'tradingview-widget-container';
  tickerTapeContainer.style = 'width: 100%; overflow: hidden;';
  
  const tickerTapeWidget = document.createElement('div');
  tickerTapeWidget.className = 'tradingview-widget-container__widget';
  
  tickerTapeContainer.appendChild(tickerTapeWidget);

  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.async = true;
  script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
  script.innerHTML = `
    {
      "symbols": [
        {
          "proName": "BITSTAMP:BTCUSD",
          "title": "Bitcoin"
        },
        {
          "proName": "BITSTAMP:ETHUSD",
          "title": "Ethereum"
        },
        {
          "description": "ММВБ",
          "proName": "MOEX:MOEX10"
        },
        {
          "description": "RUB/USD",
          "proName": "FX_IDC:RUBUSD"
        },
        {
          "description": "RUB/EUR",
          "proName": "FX_IDC:RUBEUR"
        },
        {
          "description": "RUB/CNY",
          "proName": "FX_IDC:RUBCNY"
        }
      ],
      "showSymbolLogo": true,
      "isTransparent": false,
      "displayMode": "adaptive",
      "colorTheme": "light",
      "locale": "ru"
    }
  `;
  
  tickerTapeContainer.appendChild(script);

  return tickerTapeContainer;
}

