# 🎯 ANCHOR: COMPACT RANGE DROPDOWN GEOMETRY GAP

**Статус:** Audit Only (no patch)  
**Дата:** 24 января 2026  
**Контекст:** После PATCH 1+2 видно зазор между кнопкой Range и dropdown меню. Нужно выявить причину.

---

## 📋 1) DROPDOWN POSITIONING (базовые правила)

**Файл:** `fingineerwebapp/src/components/Results/Chart/toolbar/dropdown/ChartToolbar.dropdown.css`  
**Строки 14–36 (базовая панель dropdown):**

```css
/* Базовая панель dropdown */
.dropdown-menu,
.tb-dd__panel {
  position: absolute;           /* ← Абсолютное позиционирование */
  top: 100%;                    /* ← Dropdown начинается ПОСЛЕ button */
  left: 0;
  margin-top: var(--tb-dropdown-offset);  /* ← ★ ВОТ ОТСТУП! */
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
```

### Ключевая позиция

```css
top: 100%;                              /* Dropdown top = button bottom */
margin-top: var(--tb-dropdown-offset);  /* ← GAP! */
```

---

## 🔍 2) PATCH 1 OVERRIDE (Compact toolbar)

**Файл:** `fingineerwebapp/src/components/Results/Chart/toolbar/dropdown/ChartToolbar.dropdown.css`  
**Строки 48–57 (override для Compact):**

```css
/* Compact: override Chart.css reset inside .chart-container */
.chart-container [data-role="compact-toolbar"] .dropdown-menu.tb-dropdown {
  background: var(--tb-dropdown-range-bg) !important;
  border: var(--tb-dropdown-range-border-width) solid var(--tb-dropdown-range-border-color) !important;
  box-shadow: var(--tb-dropdown-range-shadow) !important;

  /* range-specific look (not required to beat reset, but keeps design consistent) */
  border-radius: var(--tb-dropdown-range-radius);
  padding: var(--tb-dropdown-range-padding);
  /* ← НЕТУ override для margin-top / top */
}
```

### Проблема

PATCH 1 НЕ переопределяет `margin-top` → используется базовый токен `--tb-dropdown-offset`.

---

## 📊 3) TOKEN ДЛЯ GAP

**Файл:** `fingineerwebapp/src/components/Results/Chart/toolbar/tokens/ChartToolbar.tokens.css`  
**Строка 54:**

```css
--tb-dropdown-offset: 4px;  /* ← ВОТ ЭТО СОЗДАЁТ GAP! */
```

### Интерпретация

```
top: 100%;           = dropdown начало = 100% от button (от button.bottom)
margin-top: 4px;     = + 4px вниз
                     = 4px зазор между button.bottom и dropdown.top
```

---

## 🎯 4) ЯНДИАГРАММА: ГДЕ GAP?

```
┌─────────────────────────────┐
│  RANGE BUTTON               │  height: 36px
│  (--tb-range-height)        │  bottom = 36px
└─────────────────────────────┘
           ↓ margin-top: 4px ← ★ GAP ЗДЕСЬ (--tb-dropdown-offset)
           
┌─────────────────────────────┐
│  DROPDOWN MENU              │  top: 100% + margin-top: 4px
│  (--tb-dropdown-range-bg)   │
│  [1д] [5д] [1м]             │
└─────────────────────────────┘
```

---

## ✅ 5) ИТОГОВЫЙ ВЕРДИКТ: ПРИЧИНА GAP

| Параметр | Значение | Файл/Строка | Статус |
|---|---|---|---|
| **Свойство** | `margin-top` | ChartToolbar.dropdown.css:20 | ← ★ СОЗДАЁТ GAP |
| **Токен** | `--tb-dropdown-offset` | ChartToolbar.tokens.css:54 | ← ★ = 4px |
| **Причина** | Базовый offset для всех dropdown-ов | tokens.css | ← ★ НЕ переопределён в Compact |
| **Следствие** | 4px зазор между button и dropdown | visual | ← ★ "ДВОЙНАЯ КАПСУЛА" |

---

## 📍 ТОЧКА ВСТАВКИ ДЛЯ PATCH 3

**Файл:** `fingineerwebapp/src/components/Results/Chart/toolbar/dropdown/ChartToolbar.dropdown.css`

**Где:** Внутри блока:
```css
.chart-container [data-role="compact-toolbar"] .dropdown-menu.tb-dropdown {
  background: var(--tb-dropdown-range-bg) !important;
  border: ...
  box-shadow: ...
  border-radius: var(--tb-dropdown-range-radius);
  padding: var(--tb-dropdown-range-padding);
  /* ← ДОБАВИТЬ СЮДА (после padding) */
  margin-top: 0;  /* ← Убрать gap, сделать единый стек */
}
```

---

## 🔗 СВЯЗЬ С PATCH 2 (Range button)

**PATCH 2** добавил:
```css
border-radius: var(--tb-range-radius);    /* 12px */
height: var(--tb-range-height);           /* 36px */
padding: 0 var(--tb-range-pad-x);         /* 14px горизонталь */
```

**PATCH 1** добавил:
```css
border-radius: var(--tb-dropdown-range-radius);  /* 14px */
padding: var(--tb-dropdown-range-padding);       /* 6px */
margin-top: 4px ← ← ← (не переопределено!)
```

**Результат:** Button (border-radius 12px) + GAP (4px) + Dropdown (border-radius 14px) = "двойная капсула"

**Для "единого стека":** `margin-top: 0` → кнопка и меню встанут вплотную.

---

## 📋 ФИНАЛЬНЫЙ ЧЕКЛИСТ

- [x] Найдена базовая позиция dropdown (top: 100%, margin-top: var(...))
- [x] Найден токен gap (--tb-dropdown-offset: 4px)
- [x] Выявлена причина (margin-top не переопределён в Compact override)
- [x] Точка вставки определена (внутри .chart-container [...] .dropdown-menu.tb-dropdown { ... })
- [x] Решение понятно (добавить `margin-top: 0;` в PATCH 1 override)

---

## 🎯 NEXT: PATCH 3 (Geometry)

**Цель:** Убрать gap, создать "единый стек как в рефе"

**Действие:**
```css
/* Compact: override Chart.css reset inside .chart-container */
.chart-container [data-role="compact-toolbar"] .dropdown-menu.tb-dropdown {
  ...existing...
  margin-top: 0;  ← ← ← ADD THIS
}
```

**Результат:** Button и Dropdown встанут вплотную → "cap + body" визуально единое.

---

**Якорь готов. Ожидает PATCH 3.**
