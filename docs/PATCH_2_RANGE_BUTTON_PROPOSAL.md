# 🎯 PATCH 2: RANGE BUTTON STYLING

**Статус:** Audit + Proposal (Ready for Review)  
**Дата:** 24 января 2026  
**Контекст:** Range button должна быть "cap" (шапка) dropdown с плотным, объёмным стилем  
**Файл для правки:** `fingineerwebapp/src/components/Results/Chart/toolbar/controls/ChartToolbar.controls.css`

---

## 📋 АУДИТ: ТЕКУЩИЕ СТИЛИ RANGE BUTTON

### Текущие правила (ChartToolbar.controls.css, строки 128–262)

```css
.tb-btn--range {
  background: var(--tb-range-bg);
  border: var(--tb-range-border-width) solid var(--tb-range-border-color);
  box-shadow: var(--tb-range-shadow), var(--tb-range-inset-shadow);
  color: var(--tb-range-text);
}

.tb-btn--range:hover {
  background: var(--tb-range-bg-hover);
  box-shadow: var(--tb-range-shadow-hover), var(--tb-range-inset-shadow);
  transform: translateY(-1px);
}

.tb-btn--range[aria-expanded="true"] {
  background: var(--tb-range-bg-open);
  box-shadow: var(--tb-range-shadow), var(--tb-range-inset-shadow);
}
```

### Проблема

Кнопка стилизирована через `--tb-range-*` токены, но:
- Находится внутри `.chart-container`
- Reset в Chart.css: `.chart-container * { background: transparent !important; border: none !important; }`
- Результат: фон становится прозрачным, бордер исчезает → кнопка "растворяется"

**Нужно:** Override с `!important` для фона, бордера, тени (как мы делали для dropdown).

---

## 🎨 ЦЕЛЕВОЙ ДИЗАЙН (по скрину)

**Кнопка Range должна быть:**
- ✅ Плотная, объёмная (как "cap" меню)
- ✅ Тёмный непрозрачный фон (`#2b303a` или близкий к нему)
- ✅ Видимый бордер (тонкая светлая линия)
- ✅ Аккуратная тень (скевоморфизм)
- ✅ Правильный padding (не мелко)
- ✅ border-radius (мягкие углы)
- ✅ Текст читаемый (светлый)
- ✅ Hover/open состояния видны

---

## 📝 PROPOSED CODE (PATCH 2)

**Файл:** `fingineerwebapp/src/components/Results/Chart/toolbar/controls/ChartToolbar.controls.css`

**Точка вставки:** После текущего блока `.tb-btn--range[aria-expanded="true"] { ... }` (после строки 262)

### Код для вставки:

```css
/* Compact: override Chart.css reset for range button */
.chart-container [data-role="compact-toolbar"] .tb-btn--range,
.chart-container [data-role="compact-toolbar"] .tb-btn--with-text.tb-btn--range {
  background: var(--tb-range-bg) !important;
  border: var(--tb-range-border-width) solid var(--tb-range-border-color) !important;
  box-shadow: var(--tb-range-shadow), var(--tb-range-inset-shadow) !important;
  color: var(--tb-range-text) !important;
  
  /* Design consistency (no reset opposition needed) */
  border-radius: var(--tb-range-radius);
  padding: var(--tb-range-pad-x) 14px;
  height: var(--tb-range-height);
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-container [data-role="compact-toolbar"] .tb-btn--range:hover,
.chart-container [data-role="compact-toolbar"] .tb-btn--with-text.tb-btn--range:hover {
  background: var(--tb-range-bg-hover) !important;
  box-shadow: var(--tb-range-shadow-hover), var(--tb-range-inset-shadow) !important;
  transform: translateY(-1px);
}

.chart-container [data-role="compact-toolbar"] .tb-btn--range[aria-expanded="true"],
.chart-container [data-role="compact-toolbar"] .tb-btn--with-text.tb-btn--range[aria-expanded="true"] {
  background: var(--tb-range-bg-open) !important;
  box-shadow: var(--tb-range-shadow), var(--tb-range-inset-shadow) !important;
}
```

---

## ✅ АНАЛИЗ

### Токены СУЩЕСТВУЮТ ✅

| Токен | Значение | Определён |
|---|---|---|
| `--tb-range-bg` | `#2b303a` | ✅ ChartToolbar.tokens.css |
| `--tb-range-bg-hover` | `#2c313b` | ✅ |
| `--tb-range-bg-open` | `#232831` | ✅ |
| `--tb-range-border-width` | `1px` | ✅ |
| `--tb-range-border-color` | `rgba(255,255,255,0.16)` | ✅ |
| `--tb-range-shadow` | `0 4px 10px rgba(0,0,0,0.32)` | ✅ |
| `--tb-range-inset-shadow` | `inset 0 1px 1px rgba(...), inset 0 -1px 2px rgba(...)` | ✅ |
| `--tb-range-shadow-hover` | `0 5px 12px rgba(0,0,0,0.28)` | ✅ |
| `--tb-range-radius` | `12px` | ✅ |
| `--tb-range-height` | `36px` | ✅ |
| `--tb-range-pad-x` | `14px` | ✅ |
| `--tb-range-text` | `rgba(255,255,255,0.92)` | ✅ |

**Вывод:** Все токены есть. Идеально.

### DOM СЕЛЕКТОРЫ ✅

**CompactToolbar.jsx (line 108):**
```jsx
<button
  className={`tb-btn tb-btn--with-text tb-btn--range${isOpen ? ' tb-btn--open' : ''}`}
  aria-expanded={isOpen}
  ...
>
```

**Селекторы в патче покрывают:**
- ✅ `.tb-btn--range` (базовый класс)
- ✅ `.tb-btn--with-text.tb-btn--range` (комбо класс в Compact)
- ✅ `[aria-expanded="true"]` (open состояние)

### СПЕЦИФИЧНОСТЬ ✅

```
Новый селектор:
  .chart-container [data-role="compact-toolbar"] .tb-btn--range
  = 0-4-0 + !important

Reset:
  .chart-container *
  = 0-1-0 + !important

Результат: 0-4-0 + !important >>> 0-1-0 + !important ✅ ПЕРЕБИВАЕТ
```

### !important СТРАТЕГИЯ ✅

| Свойство | `!important` | Причина |
|---|---|---|
| `background` | ✅ | Перебивает reset `.chart-container * { background: transparent }` |
| `border` | ✅ | Перебивает reset `.chart-container * { border: none }` |
| `box-shadow` | ✅ | Перебивает reset (на случай) |
| `color` | ✅ | Гарантирует читаемость текста |
| `border-radius` | ❌ | Дизайн, не затронут reset |
| `padding` | ❌ | Дизайн, не затронут reset |
| `height` | ❌ | Дизайн, не затронут reset |
| `:hover` transform | ❌ | Анимация, не затронута reset |

**Логика:** `!important` ТОЛЬКО где нужно перебить reset. Остальное — чистый дизайн.

---

## 📊 ВИЗУАЛЬНОЕ СРАВНЕНИЕ

| Аспект | Было (сломано) | Будет (с патчем) |
|---|---|---|
| **Фон** | transparent (невидимо) | `#2b303a` (плотный) |
| **Бордер** | none (невидимо) | `1px solid rgba(255,255,255,0.16)` |
| **Тень** | none (невидимо) | `0 4px 10px rgba(0,0,0,0.32)` + inset |
| **Текст** | ? | `rgba(255,255,255,0.92)` (светлый, читаемый) |
| **Padding** | default | `14px 14px` (плотный) |
| **Border-radius** | default | `12px` (мягкие углы) |
| **Hover** | ? | Фон светлеет + тень растёт |
| **Open state** | ? | Фон темнеет |

---

## 🔄 СВЯЗЬ С PATCH 1 (Dropdown)

**PATCH 1** (done): Dropdown `.dropdown-menu.tb-dropdown` → фон + бордер + тень + скевоморф  
**PATCH 2** (now): Range button `.tb-btn--range` → фон + бордер + тень + скевоморф + hover/open

**Синергия:** Обе части (button + dropdown) используют один набор `--tb-range-*` токенов → консистентный дизайн.

---

## ✅ ФИНАЛЬНЫЙ ЧЕКЛИСТ (BEFORE APPLY)

- [ ] Все 12 токенов проверены → существуют в tokens.css
- [ ] DOM селекторы совпадают с CompactToolbar.jsx
- [ ] Специфичность достаточна (0-4-0 + !important > 0-1-0 + !important)
- [ ] !important стратегия sound (только background/border/box-shadow/color)
- [ ] Синтаксис CSS корректен
- [ ] Связь с PATCH 1 понятна

**Статус:** ✅ ГОТОВ К REVIEW И APPLY

---

## 🚀 NEXT STEPS

**После PATCH 2 применён:**
1. ✅ Кнопка Range видна (фон + бордер + тень)
2. ✅ Dropdown видна (done в PATCH 1)
3. ➡️ **PATCH 3 (Polish):** Glass эффект и геометрия
   - Аккуратный backdrop-filter (опционально, проверим perf)
   - Градиентный фон (полупрозрачный)
   - Мягкие hover/active состояния
   - Единая геометрия button + dropdown

**Рекомендация:** PATCH 2 → APPLY → VERIFY → PATCH 3

---

**Документ готов.**
