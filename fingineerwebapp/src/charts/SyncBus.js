export class SyncBus {
  constructor() {
    this._subscribers = new Set();
  }

  /**
   * Подписка на события шины.
   * Возвращает функцию отписки.
   */
  on(handler) {
    if (typeof handler !== 'function') {
      throw new TypeError('SyncBus.on expects a function');
    }
    this._subscribers.add(handler);
    return () => {
      this._subscribers.delete(handler);
    };
  }

  /**
   * Рассылка события всем подписчикам.
   */
  emit(payload) {
    this._subscribers.forEach((handler) => {
      try {
        handler(payload);
      } catch (err) {
        console.error('[SyncBus] handler error:', err);
      }
    });
  }
}

