# 🎯 COMPLETE PATCH DOCUMENT: COMPACT TOOLBAR RANGE DROPDOWN FIX

**Версия:** 1.0  
**Статус:** Ready for Review  
**Дата:** 24 января 2026  
**Контекст:** FG2 React — Compact toolbar range dropdown почти прозрачный/нечитаемый  
**Файл для правки:** `fingineerwebapp/src/components/Results/Chart/toolbar/dropdown/ChartToolbar.dropdown.css`

---

## 📋 ЧАСТЬ 1: АУДИТ (ANCHOR)

### 1.1) RESET В Chart.css

**Файл:** `fingineerwebapp/src/components/Results/Chart/Chart.css`  
**Строки:** 123–138

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

**Проблема:** Селектор `.chart-container *` + `.chart-container div` + `background: transparent !important` перебивает ВСЕ потомкам фон. Dropdown `.dropdown-menu.tb-dropdown` находится внутри этого контейнера → его фон становится прозрачным.

---

### 1.2) DROPDOWN СТИЛИ В ChartToolbar.dropdown.css

**Файл:** `fingineerwebapp/src/components/Results/Chart/toolbar/dropdown/ChartToolbar.dropdown.css`  
**Строки:** 14–42

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
  background: var(--tb-dropdown-bg);  /* ← БЕЗ !important */
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

**Факт:** `background: var(--tb-dropdown-bg)` без `!important` → reset из Chart.css перебивает его.

---

### 1.3) TOKENS ДЛЯ RANGE DROPDOWN

**Файл:** `fingineerwebapp/src/components/Results/Chart/toolbar/tokens/ChartToolbar.tokens.css`  
**Строки:** 55–103

```css
  --tb-dropdown-range-bg: #20252e;
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

**Вывод:** Токены **ОПРЕДЕЛЕНЫ**, но **НЕ ИСПОЛЬЗУЮТСЯ** в CSS.

---

### 1.4) DOM-КОНТЕКСТ

**Структура (CompactToolbar.jsx):**
```html
<div class="tb__section" data-role="compact-toolbar">
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

**Родитель (Chart.js):**
```jsx
<div class="chart-wrapper">
  <div class="chart-container">  ← ★ RESET ПРИМЕНЯЕТСЯ СЮДА
    <CompactToolbar ... />       ← CompactToolbar ЗДЕСЬ
    <CompactSparkline ... />
  </div>
</div>
```

**DOM-цепочка:**
```
.chart-container (reset применяется здесь)
  └─ .tb__section[data-role="compact-toolbar"]
      └─ .dropdown-container.tb-dd
          └─ .dropdown-menu.tb-dropdown  ← ПОСТРАДАЛ
              └─ .tb-dd__item (buttons)
```

---

### 1.5) АНАЛИЗ СПЕЦИФИЧНОСТИ

| Селектор | Специфичность | `!important` | Результат |
|---|---|---|---|
| `.chart-container *` | 0-1-1 | ✅ | **ВЫИГРЫВАЕТ** |
| `.chart-container div` | 0-1-2 | ✅ | **ВЫИГРЫВАЕТ** |
| `.dropdown-menu.tb-dropdown` | 0-0-2 | ❌ | Проигрывает |

**Вердикт:** Reset побеждает. Нужен селектор с higher specificity + `!important`.

---

## 📝 ЧАСТЬ 2: DIFF & PATCH

### 2.1) PROPOSED DIFF

**Файл:** `fingineerwebapp/src/components/Results/Chart/toolbar/dropdown/ChartToolbar.dropdown.css`

**Точка вставки:** После строки 46 (после блока `.dropdown-menu.tb-dropdown { backdrop-filter: none; ... }`)

```diff
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

+/* ✅ COMPACT TOOLBAR RANGE OVERRIDE: перебивает reset из Chart.css */
+.chart-container [data-role="compact-toolbar"] .dropdown-menu.tb-dropdown {
+  background: var(--tb-dropdown-range-bg) !important;
+  border: var(--tb-dropdown-range-border-width) solid var(--tb-dropdown-range-border-color) !important;
+  box-shadow: var(--tb-dropdown-range-shadow) !important;
+}
+
+.chart-container [data-role="compact-toolbar"] .dropdown-menu.tb-dropdown .tb-dd__item {
+  background: transparent !important;
+  color: var(--tb-dropdown-range-item-color) !important;
+}
+
+.chart-container [data-role="compact-toolbar"] .dropdown-menu.tb-dropdown .tb-dd__item:hover {
+  background: var(--tb-dropdown-range-item-hover-bg) !important;
+}
+
+.chart-container [data-role="compact-toolbar"] .dropdown-menu.tb-dropdown .tb-dd__item[data-state="active"],
+.chart-container [data-role="compact-toolbar"] .dropdown-menu.tb-dropdown .tb-dd__item[aria-selected="true"] {
+  background: var(--tb-dropdown-range-item-active-bg) !important;
+  color: #ffffff !important;
+  font-weight: var(--tb-dropdown-range-item-weight-active);
+}

.dropdown-menu.debug,
.tb-dd__panel--debug {
  outline: 1px dashed rgba(255, 0, 0, 0.4);
}
```

---

### 2.2) КОД ДЛЯ ВСТАВКИ (EXACT TEXT)

Вставить **целиком** после строки 46, перед блоком `.dropdown-menu.debug`:

```css
/* ✅ COMPACT TOOLBAR RANGE OVERRIDE: перебивает reset из Chart.css */
.chart-container [data-role="compact-toolbar"] .dropdown-menu.tb-dropdown {
  background: var(--tb-dropdown-range-bg) !important;
  border: var(--tb-dropdown-range-border-width) solid var(--tb-dropdown-range-border-color) !important;
  box-shadow: var(--tb-dropdown-range-shadow) !important;
}

.chart-container [data-role="compact-toolbar"] .dropdown-menu.tb-dropdown .tb-dd__item {
  background: transparent !important;
  color: var(--tb-dropdown-range-item-color) !important;
}

.chart-container [data-role="compact-toolbar"] .dropdown-menu.tb-dropdown .tb-dd__item:hover {
  background: var(--tb-dropdown-range-item-hover-bg) !important;
}

.chart-container [data-role="compact-toolbar"] .dropdown-menu.tb-dropdown .tb-dd__item[data-state="active"],
.chart-container [data-role="compact-toolbar"] .dropdown-menu.tb-dropdown .tb-dd__item[aria-selected="true"] {
  background: var(--tb-dropdown-range-item-active-bg) !important;
  color: #ffffff !important;
  font-weight: var(--tb-dropdown-range-item-weight-active);
}
```

---

### 2.3) ПАРАМЕТРЫ ПАТЧА

| Метрика | Значение |
|---|---|
| **Файл** | `fingineerwebapp/src/components/Results/Chart/toolbar/dropdown/ChartToolbar.dropdown.css` |
| **Операция** | Добавление (append after line 46) |
| **Новых строк** | 24 (включая пустые и комментарий) |
| **Затронутых правил** | 0 (ТОЛЬКО ДОБАВЛЕНИЕ) |
| **Риск регрессии** | ✅ МИНИМАЛЬНЫЙ (узкий селектор с `[data-role="compact-toolbar"]`) |
| **Специфичность** | 0-3-3 + `!important` ✅ Перебивает reset (0-1-1 + `!important`) |
| **Файлы НЕ трогаются** | ✅ Chart.css, ChartToolbar.tokens.css |

---

## ✅ ЧАСТЬ 3: ВЕРИФИКАЦИЯ

### 3.1) ЧЕКЛИСТ ВЕРИФИКАЦИИ (AFTER PATCH APPLIED)

Выполнить после применения патча:

- [ ] **Компиляция:** Ошибок нет, приложение стартует нормально
- [ ] **DevTools Inspection:** Открыть Compact → нажать Range dropdown
  - [ ] `.dropdown-menu.tb-dropdown` → Computed `background` = `#20252e` (НЕ transparent)
  - [ ] `border` = `1px solid rgba(255,255,255,0.08)` (НЕ none)
  - [ ] `box-shadow` = `0 10px 26px rgba(0,0,0,0.35)` (видна тень)
- [ ] **Items читаемость:**
  - [ ] `.tb-dd__item` → `color` = `rgba(255,255,255,0.9)` (светлый текст)
  - [ ] `:hover` state → `background` = `rgba(255,255,255,0.06)` (виден hover)
  - [ ] `[data-state="active"]` → `background` = `rgba(255,255,255,0.1)` (выделено)
- [ ] **Визуальная проверка:**
  - [ ] Меню непрозрачное: линия графика под ним НЕ просвечивает
  - [ ] Пункты читаемы: текст различим на фоне
  - [ ] Hover/active состояния видны
- [ ] **Scope изоляция:**
  - [ ] Другие dropdown-ы (если есть вне Compact) НЕ затронуты
  - [ ] Только Compact range dropdown получил новые стили
- [ ] **Responsive:**
  - [ ] Desktop (1200px+) → OK
  - [ ] Tablet (768px–1024px) → OK
  - [ ] Mobile (< 768px) → OK

### 3.2) TEST STEPS

```
1. Запустить фронтенд (npm start в fingineerwebapp)
2. Открыть приложение
3. Выбрать акцию/тикер (чтобы показался Compact Toolbar)
4. Нажать кнопку Range (1д/5д/1м/etc.)
5. Проверить dropdown-меню:
   ✓ Фон: темный непрозрачный (не белый, не transparent)
   ✓ Бордер: виден (тонкая светлая линия)
   ✓ Тень: видна
   ✓ Текст пункков: читаемый (белый/светлый)
   ✓ Hover: фон меняется при наведении
   ✓ Active: пункт выделен
6. Выбрать другой range (пункт меню должен активироваться)
7. F12 → DevTools → Elements → выбрать .dropdown-menu.tb-dropdown
   → Computed tab → проверить background/border/box-shadow значения
```

---

## 📊 ЧАСТЬ 4: РЕЗЮМЕ & МЕТРИКИ

### 4.1) ЧТО СЛОМАНО

1. ❌ Global reset в `Chart.css` (`.chart-container *`) применяет `background: transparent !important` ко ВСЕМ потомкам
2. ❌ Range dropdown находится внутри `.chart-container` → фон становится прозрачным
3. ❌ Dropdown токены `--tb-dropdown-range-*` определены в `tokens.css`, но НЕ используются

### 4.2) КАК ИСПРАВИТЬ

✅ Добавить контекстный селектор `.chart-container [data-role="compact-toolbar"] .dropdown-menu.tb-dropdown` с `!important`  
✅ Применить токены `--tb-dropdown-range-*` к dropdown внутри Compact  
✅ Переопределить пункты dropdown (items) с корректными цветами и фонами  

### 4.3) ИТОГИ ПАТЧА

| Параметр | Статус |
|---|---|
| **Файл для правки** | ✅ `ChartToolbar.dropdown.css` (1 файл) |
| **Режим** | ✅ ДОБАВЛЕНИЕ (append, no deletions) |
| **Селектор** | ✅ `.chart-container [data-role="compact-toolbar"]` (узкий скоп) |
| **Токены** | ✅ ИСПОЛЬЗУЮТСЯ `--tb-dropdown-range-*` (из tokens.css) |
| **!important** | ✅ ТОЛЬКО где нужно перебить reset (background/border/box-shadow) |
| **Регрессия** | ✅ МИНИМАЛЬНАЯ (изолированный override) |
| **Специфичность** | ✅ 0-3-3 + `!important` > 0-1-1 + `!important` (reset) |

---

## 🚀 ЧАСТЬ 5: ИНСТРУКЦИЯ ПО ПРИМЕНЕНИЮ

### 5.1) ШАГИ ПРИМЕНЕНИЯ

```
1. Открыть файл:
   fingineerwebapp/src/components/Results/Chart/toolbar/dropdown/ChartToolbar.dropdown.css

2. Найти строку 46 (блок):
   .dropdown-menu.tb-dropdown {
     backdrop-filter: none;
     -webkit-backdrop-filter: none;
   }

3. Поставить курсор ПОСЛЕ этого блока (после закрывающей скобки })

4. Вставить пустую строку и ВЕСЬ КОД из раздела 2.2

5. Сохранить файл (Ctrl+S)

6. Проверить в браузере (он перезагрузится автоматически)
```

### 5.2) АЛЬТЕРНАТИВНЫЙ СПОСОБ (VIA SEARCH & REPLACE)

**Найти:**
```css
/* Range-only dropdown: disable blur (calm matte look) */
.dropdown-menu.tb-dropdown {
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.dropdown-menu.debug,
```

**Заменить на:**
```css
/* Range-only dropdown: disable blur (calm matte look) */
.dropdown-menu.tb-dropdown {
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

/* ✅ COMPACT TOOLBAR RANGE OVERRIDE: перебивает reset из Chart.css */
.chart-container [data-role="compact-toolbar"] .dropdown-menu.tb-dropdown {
  background: var(--tb-dropdown-range-bg) !important;
  border: var(--tb-dropdown-range-border-width) solid var(--tb-dropdown-range-border-color) !important;
  box-shadow: var(--tb-dropdown-range-shadow) !important;
}

.chart-container [data-role="compact-toolbar"] .dropdown-menu.tb-dropdown .tb-dd__item {
  background: transparent !important;
  color: var(--tb-dropdown-range-item-color) !important;
}

.chart-container [data-role="compact-toolbar"] .dropdown-menu.tb-dropdown .tb-dd__item:hover {
  background: var(--tb-dropdown-range-item-hover-bg) !important;
}

.chart-container [data-role="compact-toolbar"] .dropdown-menu.tb-dropdown .tb-dd__item[data-state="active"],
.chart-container [data-role="compact-toolbar"] .dropdown-menu.tb-dropdown .tb-dd__item[aria-selected="true"] {
  background: var(--tb-dropdown-range-item-active-bg) !important;
  color: #ffffff !important;
  font-weight: var(--tb-dropdown-range-item-weight-active);
}

.dropdown-menu.debug,
```

---

## 📌 ФИНАЛЬНЫЙ ЧЕКЛИСТ

Перед применением:
- [ ] Прочитана ЧАСТЬ 1 (аудит) — понимаешь проблему
- [ ] Прочитана ЧАСТЬ 2 (diff) — согласен с решением
- [ ] Скопирован точный код из раздела 2.2

После применения:
- [ ] Файл сохранен
- [ ] Браузер перезагрузился / приложение перекомпилировалось
- [ ] Выполнены шаги верификации из ЧАСТИ 3
- [ ] Все пункты чеклиста отмечены ✅

---

**🎯 Документ готов к применению патча PATCH 1.**  
**Дата:** 24 января 2026  
**Версия:** 1.0 (Final)
