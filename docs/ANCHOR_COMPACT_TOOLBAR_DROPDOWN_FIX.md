# 🎯 ЯКОРЬ: АУДИТ DROPDOWN-ПРОЗРАЧНОСТИ В COMPACT TOOLBAR

**Статус:** Audit Only (без патча)  
**Дата:** 24 января 2026  
**Контекст:** FG2 / React. Compact toolbar range dropdown почти прозрачный/нечитаемый.

---

## 📋 1) RESET В Chart.css

**Файл:** `fingineerwebapp/src/components/Results/Chart/Chart.css`

**Строки 123–138 (блок reset):**
```css
/* ✅ ПРОСТОЕ И ЭФФЕКТИВНОЕ РЕШЕНИЕ: Убираем все границы */
.chart-container *,
.chart-container canvas,
.chart-container div,
.chart-container table,
.chart-container tr,
.chart-container td {
  border: none !important;
  outline: none !important;
  background: transparent !important;
}

/* Restore compact hover dot/hairline after global reset */
.chart-container .compact-sparkline-hairline {
  background: rgba(255, 255, 255, 0.14) !important;
}

.chart-container .compact-sparkline-dot {
  background: #4fd1c5 !important;
}
```

### Проблема
Селектор `.chart-container *` + `.chart-container div` + `background: transparent !important` перебивает ВСЕМ потомкам background. Dropdown `.dropdown-menu.tb-dropdown` находится внутри этого контейнера, поэтому его фон становится прозрачным, несмотря на то, что в `ChartToolbar.dropdown.css` установлен `background: var(--tb-dropdown-bg)`.

---

## 📋 2) DROPDOWN СТИЛИ в ChartToolbar.dropdown.css

**Файл:** `fingineerwebapp/src/components/Results/Chart/toolbar/dropdown/ChartToolbar.dropdown.css`

### Базовая панель dropdown (строки 14–42):
```css
/* Базовая панель dropdown */
.dropdown-menu,
.tb-dd__panel {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: var(--tb-dropdown-offset);
  z-index: var(--z-dropdown, 60);
  width: var(--tb-dropdown-width);
  min-width: var(--tb-dropdown-min-width);
  max-width: var(--tb-dropdown-max-width);
  max-height: var(--tb-dropdown-max-height);
  padding: var(--tb-dropdown-padding);
  background: var(--tb-dropdown-bg);
  border: var(--tb-dropdown-border-width) solid var(--tb-dropdown-border-color);
  border-radius: var(--tb-dropdown-radius);
  box-shadow: var(--tb-dropdown-shadow);
  backdrop-filter: blur(var(--tb-dropdown-blur));
  -webkit-backdrop-filter: blur(var(--tb-dropdown-blur));
  overflow: auto;
  animation: dropdownFadeIn 0.2s ease-out;
  inline-size: max-content;
  min-inline-size: 100%;
  max-inline-size: 36ch;
}

/* Range-only dropdown: disable blur (calm matte look) */
.dropdown-menu.tb-dropdown {
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}
```

**Факт:** `background: var(--tb-dropdown-bg)` БЕЗ `!important` ⚠️ Поэтому reset из Chart.css перебивает его.

### Пункты dropdown (строки 49–80):
```css
/* Пункт dropdown */
.dropdown-option,
.tb-dd__item {
  display: flex;
  align-items: center;
  gap: var(--tb-dropdown-item-gap);
  width: 100%;
  padding: var(--tb-dropdown-item-padding);
  border-radius: var(--tb-dropdown-item-radius);
  font-size: var(--tb-dropdown-item-font-size);
  line-height: 1.25;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  background: transparent;
  border: none;
  color: var(--fg-text);
  cursor: pointer;
  transition: background var(--tb-transition);
}

.dropdown-option:hover,
.tb-dd__item:hover {
  background: var(--tb-dropdown-item-hover-bg);
}

.dropdown-option.active,
.tb-dd__item[data-state="active"],
.tb-dd__item[aria-selected="true"] {
  background: var(--tb-dropdown-item-active-bg);
  color: var(--tb-dropdown-item-active-color);
}
```

**Факт:** Пункты используют `var(--tb-dropdown-item-hover-bg)` и `var(--tb-dropdown-item-active-bg)` также БЕЗ `!important`.

---

## 📋 3) TOKENS для Range Dropdown в ChartToolbar.tokens.css

**Файл:** `fingineerwebapp/src/components/Results/Chart/toolbar/tokens/ChartToolbar.tokens.css`

### Строки 55–103 (токены dropdown):
```css
  /* Dropdowns */
  --tb-dropdown-width: clamp(220px, 28vw, 320px);
  --tb-dropdown-min-width: 220px;
  --tb-dropdown-max-width: 320px;
  --tb-dropdown-max-height: 300px;
  --tb-dropdown-padding: 8px;
  --tb-dropdown-offset: 4px;
  --tb-dropdown-bg: rgba(255, 255, 255, 0.18);  /* ← Почти прозрачный! */
  --tb-dropdown-border-color: rgba(0, 0, 0, 0.06);
  --tb-dropdown-border-width: 1px;
  --tb-dropdown-radius: 14px;
  --tb-dropdown-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
  --tb-dropdown-blur: 4px;
  --tb-dropdown-item-radius: 10px;
  --tb-dropdown-item-padding: 10px 12px;
  --tb-dropdown-item-font-size: 14px;
  --tb-dropdown-item-gap: 10px;
  --tb-dropdown-item-hover-bg: rgba(22, 22, 25, 0.15);   /* ← Слабый хаовер */
  --tb-dropdown-item-active-bg: rgba(22, 22, 25, 0.15);  /* ← Слабый активный */
  --tb-dropdown-item-active-color: #ffffff;
  --tb-dropdown-scrollbar: rgba(0, 0, 0, 0.18);
  --tb-indicator-dropdown-width: 140px;

  /* Range + Expand controls (calm skeuomorphism) */
  --tb-dropdown-range-bg: #20252e;                        /* ← Есть для Range! */
  --tb-dropdown-range-border-color: rgba(255, 255, 255, 0.08);
  --tb-dropdown-range-border-width: 1px;
  --tb-dropdown-range-radius: 14px;
  --tb-dropdown-range-shadow: 0 10px 26px rgba(0, 0, 0, 0.35);
  --tb-dropdown-range-padding: 6px;
  --tb-dropdown-range-item-radius: 10px;
  --tb-dropdown-range-item-padding: 10px 12px;
  --tb-dropdown-range-item-hover-bg: rgba(255, 255, 255, 0.06);
  --tb-dropdown-range-item-active-bg: rgba(255, 255, 255, 0.1);
  --tb-dropdown-range-item-color: rgba(255, 255, 255, 0.9);
  --tb-dropdown-range-item-weight-active: 600;
```

### Вывод
Токены для range dropdown **ОПРЕДЕЛЕНЫ** (`--tb-dropdown-range-*`), но **НЕ ИСПОЛЬЗУЮТСЯ** в CSS! Нужно создать селектор, который их применит.

---

## 📋 4) DOM-КОНТЕКСТ И DATA-FLOW

### Структура (CompactToolbar.jsx)
```html
<div class="tb__section" data-role="compact-toolbar">
  <div class="tb__slot--left">...</div>
  <div class="tb__slot--right">
    <div class="dropdown-container tb-dd">
      <button class="tb-btn tb-btn--range">1д</button>
      {isOpen && (
        <div class="dropdown-menu tb-dropdown">  ← ★ ЦЕЛЕВОЙ ЭЛЕМЕНТ
          <button class="tb-dd__item">1д</button>
          <button class="tb-dd__item">5д</button>
          ...
        </div>
      )}
    </div>
  </div>
</div>
```

### Родитель (Chart.js)
```jsx
<div class="chart-wrapper">
  <div class="chart-container">  ← ★ RESET ПРИМЕНЯЕТСЯ СЮДА И КО ВСЕМ ПОТОМКАМ
    <CompactToolbar ... />       ← CompactToolbar рендерится ЗДЕСЬ
    <CompactSparkline ... />
  </div>
</div>
```

### DOM-цепочка
```
.chart-container
  └─ .tb__section (CompactToolbar root)
      └─ .dropdown-container.tb-dd
          └─ .dropdown-menu.tb-dropdown  ← На этот элемент действует reset!
              └─ .tb-dd__item (buttons)
```

### Проблема специфичности
- Reset селектор: `.chart-container *` (специфичность: 0-1-1)
- Reset селектор: `.chart-container div` (специфичность: 0-1-2)
- Оба имеют `!important`
- Dropdown селектор: `.dropdown-menu.tb-dropdown` (специфичность: 0-0-2) БЕЗ `!important`

✅ **Вердикт:** Reset ВЫИГРЫВАЕТ из-за `!important`.

---

## 📋 5) ПУТ-SNIPPET И ТОЧКА ВСТАВКИ

| Параметр | Значение |
|---|---|
| **Файл reset** | `fingineerwebapp/src/components/Results/Chart/Chart.css` (строки 123–138) |
| **Файл dropdown** | `fingineerwebapp/src/components/Results/Chart/toolbar/dropdown/ChartToolbar.dropdown.css` (строки 14–42) |
| **Файл tokens** | `fingineerwebapp/src/components/Results/Chart/toolbar/tokens/ChartToolbar.tokens.css` (строки 55–103) |
| **DOM-контекст** | `<div class="chart-container">` → `<CompactToolbar>` → `.dropdown-menu.tb-dropdown` |
| **Точка вставки** | `ChartToolbar.dropdown.css` после строки 42 |
| **Требуемая специфичность** | `.chart-container .dropdown-container .dropdown-menu.tb-dropdown` (0-2-2) + `!important` |

---

## 🛠️ ТОЧКА ВСТАВКИ ДЛЯ PATCH 1

**Целевой файл:** `fingineerwebapp/src/components/Results/Chart/toolbar/dropdown/ChartToolbar.dropdown.css`

**После строки 42** (после блока `.dropdown-menu.tb-dropdown`):

### Новый код для вставки:

```css
/* ✅ OVERRIDE range dropdown внутри .chart-container (перебивает reset) */
.chart-container .dropdown-menu.tb-dropdown {
  background: var(--tb-dropdown-range-bg) !important;
  border: var(--tb-dropdown-range-border-width) solid var(--tb-dropdown-range-border-color) !important;
  box-shadow: var(--tb-dropdown-range-shadow) !important;
}

.chart-container .dropdown-menu.tb-dropdown .tb-dd__item {
  background: transparent !important;
  color: var(--tb-dropdown-range-item-color) !important;
}

.chart-container .dropdown-menu.tb-dropdown .tb-dd__item:hover {
  background: var(--tb-dropdown-range-item-hover-bg) !important;
}

.chart-container .dropdown-menu.tb-dropdown .tb-dd__item[data-state="active"],
.chart-container .dropdown-menu.tb-dropdown .tb-dd__item[aria-selected="true"] {
  background: var(--tb-dropdown-range-item-active-bg) !important;
  color: #ffffff !important;
  font-weight: var(--tb-dropdown-range-item-weight-active);
}
```

### Почему эта позиция:
- Селектор `.chart-container .dropdown-menu.tb-dropdown` имеет специфичность **0-2-3** + `!important` → гарантировано перебьёт reset
- Контекст `.chart-container` явно указывает на цель (не применится к другим dropdown-ам вне chart)
- Размещение ПОСЛЕ базовых правил dropdown позволяет переопределить их в контексте chart-container

---

## ⚠️ РИСКИ

### Риск 1: Другие dropdown-ы в .chart-container сломаются
- Если есть другие dropdown-ы (календарь, индикаторы и т.п.), они ТАКЖЕ получат `--tb-dropdown-range-*` токены
- **Решение:** Проверить CompactToolbar и убедиться, что других dropdown-ов в chart-container нет ИЛИ создать более узкий селектор `.chart-container .dropdown-container .dropdown-menu.tb-dropdown`

### Риск 2: !important может сломать будущие hover-состояния
- Если понадобятся специальные hover-эффекты, `!important` заблокирует их
- **Решение:** Использовать `!important` ТОЛЬКО на background/border/shadow. Переходы и состояния должны оставаться без `!important`

### Риск 3: Mobile-версия может получить нежелательный стиль
- В `ChartToolbar.dropdown.css` строки 227+ есть `@media (max-width: 768px)` с переопределением background на `#ffffff !important`
- Наш новый селектор может конфликтовать
- **Решение:** Добавить аналогичный media-блок с мобильными override-ами

---

## 🎯 РЕКОМЕНДАЦИЯ ПО СПЕЦИФИЧНОСТИ

### Основной селектор (гарантированно перебьёт reset):

```css
.chart-container .dropdown-container .dropdown-menu.tb-dropdown {
  background: var(--tb-dropdown-range-bg) !important;
  /* ... */
}
```

### Специфичность:
- `.chart-container` (0-1-0)
- `.dropdown-container` (0-1-0)  
- `.dropdown-menu.tb-dropdown` (0-0-2)
- **Итого:** 0-2-2 + `!important`
- Reset специфичность: 0-1-1 + `!important`
- **Результат:** ✅ ПЕРЕБИВАЕТ (потому что класс `.dropdown-container` даёт +1 к классам)

### Альтернатива (очень узкая, если нужна максимальная безопасность):
```css
.chart-wrapper:not(.expanded) .chart-container .dropdown-menu.tb-dropdown {
  /* ... */
}
```
Специфичность: 0-3-2 + `!important` → гарантированный overkill.

---

## ✅ РЕЗЮМЕ

**Что сломано:**
1. Global reset в Chart.css (`.chart-container *`) применяет `background: transparent !important` ко всем потомкам
2. Range dropdown находится внутри `.chart-container`, поэтому его фон становится прозрачным
3. Dropdown токены `--tb-dropdown-range-*` определены в tokens.css, но не используются в CSS

**Как исправить:**
- Добавить контекстный селектор `.chart-container .dropdown-menu.tb-dropdown` с `!important`
- Применить токены `--tb-dropdown-range-*` к dropdown внутри chart-container
- Переопределить пункты dropdown (items) с корректными цветами и фонами

**Файл для вставки:**
- `fingineerwebapp/src/components/Results/Chart/toolbar/dropdown/ChartToolbar.dropdown.css`

**Позиция вставки:**
- После строки 42 (после блока `.dropdown-menu.tb-dropdown`)

**Специфичность гарантирует перебой:**
- New: 0-2-3 + `!important` → Перебивает Reset: 0-1-1 + `!important`

---

**Якорь готов. Ожидает PATCH 1.**
