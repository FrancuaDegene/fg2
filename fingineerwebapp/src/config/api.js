// API Configuration
const config = {
  // Backend URLs - можно изменить здесь для разных окружений
  SOCKET_URL: process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001',
  API_BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  SUGGESTIONS_API_URL: process.env.REACT_APP_SUGGESTIONS_URL || 'http://localhost',
  INSTRUMENTS_API_URL: process.env.REACT_APP_INSTRUMENTS_API_URL || process.env.REACT_APP_SUGGESTIONS_URL || 'http://localhost:3002',
  
  // Socket.IO настройки
  SOCKET_OPTIONS: {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 20000,
  },
  
  // API endpoints
  ENDPOINTS: {
    TICKER: '/api/ticker',
    SUGGESTIONS: '/api/suggestions',
    INSTRUMENTS_BROWSE: '/api/instruments/browse',
    NEWS: '/api/news',
    DIVIDENDS: '/api/dividends',
    AI_CHAT: '/api/chat',
    AI_CHAT_STREAM: '/api/chat-stream',
    CANDLES_V2: '/api/candles-v2',
  }
};

export default config;
