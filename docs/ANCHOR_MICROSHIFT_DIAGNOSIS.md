# ANCHOR: Micro-shift при открытии Range dropdown

## Диагноз
При нажатии на кнопку Range (isOpen=true) сам Range control визуально "опускается" на несколько пикселей относительно кнопки Expand и sparkline.

---

## 1. JSX структура (CompactToolbar.jsx, строки 100-140)

```jsx
<div className="tb__slot--right" style={{ padding: '8px 10px' }}>
  {/* SLOT: .tb__slot--right с padding: 8px 10px */}
  
  <div className="dropdown-container tb-dd" ref={anchorRef}>
    {/* ANCHOR: .dropdown-container.tb-dd — position: relative (z-index, flex-shrink) */}
    
    <div className="tb-range" data-state={isOpen ? 'open' : 'closed'}>
      {/* WRAPPER: .tb-range — display: inline-flex; flex-direction: column; width: fit-content; */}
      
      <button
        className={`tb-btn tb-btn--with-text tb-btn--range${isOpen ? ' tb-btn--open' : ''}`}
        aria-expanded={isOpen}
      >
        {currentLabel}
      </button>
      {/* WHEN OPEN: addClass "tb-btn--open" AND aria-expanded="true" */}
      
      {isOpen && (
        <div className="dropdown-menu tb-dropdown" ref={contentRef}>
          {RANGES.map(/* ... */)}
        </div>
      )}
    </div>
  </div>
  
  <button className="tb-btn tb-btn--expand" onClick={handleExpand}>
    {/* NEIGHBOR: кнопка Expand в соседнем DOM-узле */}
  </button>
</div>
```

---

## 2. CSS для контейнеров (ChartToolbar.dropdown.css, строки 1–120)

### Base rules (стабильное состояние, CLOSED):
```css
.dropdown-container,
.tb-dd {
  position: relative;           /* 🔑 anchor for absolute menu */
  z-index: var(--z-dropdown, 60);
  flex-shrink: 0;
}

.tb-range {
  /* CLOSED state (implicit) */
  display: inline-flex;
  flex-direction: column;
  width: fit-content;          /* 🔑 shrink-to-fit */
}
```

### OPEN state rules (ChartToolbar.dropdown.css, строки 50–95):
```css
.chart-container [data-role="compact-toolbar"] .tb-range[data-state="open"] {
  background: var(--tb-dropdown-range-bg) !important;
  border: var(--tb-dropdown-range-border-width) solid var(--tb-dropdown-range-border-color) !important;
  box-shadow: var(--tb-dropdown-range-shadow) !important;
  border-radius: var(--tb-dropdown-range-radius);
  box-sizing: border-box !important;
  overflow: hidden;
  
  /* 🔴 CRITICAL SHIFT CAUSE #1 */
  position: absolute;           /* moved from relative → absolute */
  top: 0;                        /* positioned at parent's top */
  right: 0;                      /* positioned at parent's right */
  z-index: calc(var(--z-dropdown, 60) + 1);
  
  /* 🔴 CRITICAL SHIFT CAUSE #2 */
  padding-top: var(--tb-dropdown-range-border-width);  /* adds 1px top padding */
}

.chart-container [data-role="compact-toolbar"] .tb-range[data-state="open"] .tb-btn--range {
  background: transparent !important;
  border: 0 !important;
  box-shadow: none !important;
  border-radius: 0;
  
  /* 🔴 CRITICAL SHIFT CAUSE #3 */
  margin-top: calc(-1 * var(--tb-dropdown-range-border-width));  /* -1px */
}
```

---

## 3. CSS для кнопок (ChartToolbar.controls.css, строки 1–40)

### Range button (CLOSED state):
```css
.tb-btn--range {
  background: var(--tb-range-bg);                    /* #2b303a */
  border: var(--tb-range-border-width) solid var(--tb-range-border-color);  /* 1px border */
  box-shadow: var(--tb-range-shadow), var(--tb-range-inset-shadow);
  color: var(--tb-range-text);
  /* line-height, padding implicit from .tb-btn--with-text */
}

.tb-btn--with-text {
  background: #f5f5f5;
  border: none;
  border-radius: 12px;
  padding: 10px 14px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}
```

### Range button (OPEN state):
```css
.chart-container [data-role="compact-toolbar"] .tb-btn--range[aria-expanded="true"],
.chart-container [data-role="compact-toolbar"] .tb-btn--with-text.tb-btn--range[aria-expanded="true"] {
  border-bottom: 0 !important;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  box-shadow: none !important;
  
  position: relative;
  z-index: calc(var(--z-dropdown, 60) + 1);
}

.chart-container [data-role="compact-toolbar"] .tb-btn--range[aria-expanded="true"]:hover,
.chart-container [data-role="compact-toolbar"] .tb-btn--with-text.tb-btn--range[aria-expanded="true"]:hover {
  transform: none;  /* 🔑 no scale/translate on hover */
}
```

---

## 4. Computed-style diff: CLOSED vs OPEN

| Элемент | Свойство | CLOSED | OPEN | Δ (shift) |
|---------|----------|--------|------|----------|
| **.tb-range** | `display` | inline-flex | inline-flex | ✓ same |
| **.tb-range** | `position` | (static) | absolute | ❌ **+absolute** |
| **.tb-range** | `top` | (auto) | 0 | ❌ locks to parent top |
| **.tb-range** | `padding-top` | 0 | 1px (`--tb-dropdown-range-border-width`) | ❌ **+1px down** |
| **.tb-range** | `width` | fit-content | fit-content | ✓ same |
| **.tb-btn--range** | `margin-top` | 0 | -1px | ❌ **-1px pulls up** |
| **.tb-btn--range** | `height` | 44px (min-height) | 44px | ✓ same |
| **.tb-btn--range** | `border` | 1px solid | 0 | ✓ removed (good) |
| **.tb-btn--range** | `box-shadow` | yes | none | ✓ removed (good) |
| **Expand кнопка** | `position` | (static, flex sibling) | (static, still flex sibling) | ✓ NOT shifted |
| **Sparkline** | `position` | (static in flow) | (static in flow) | ✓ NOT shifted |

---

## 5. Конкретные причины micro-shift

### 🔴 **Причина #1: `position: absolute` + `top: 0` на `.tb-range[data-state="open"]`**
- **Файл:** [ChartToolbar.dropdown.css](toolbar/dropdown/ChartToolbar.dropdown.css#L65-L68)
- **Селектор:** `.chart-container [data-role="compact-toolbar"] .tb-range[data-state="open"]`
- **Строки:** 65–68
- **Свойства:**
  ```css
  position: absolute;   /* 🔴 изменение позиционирования */
  top: 0;               /* 🔴 привязка к родителю вместо потока */
  ```
- **Эффект:** Wrapper выходит из документооборота (потока). Это допустимо для overlay, но...

### 🔴 **Причина #2: `padding-top: 1px` на `.tb-range[data-state="open"]`**
- **Файл:** [ChartToolbar.dropdown.css](toolbar/dropdown/ChartToolbar.dropdown.css#L72)
- **Селектор:** `.chart-container [data-role="compact-toolbar"] .tb-range[data-state="open"]`
- **Строка:** 72
- **Свойство:**
  ```css
  padding-top: var(--tb-dropdown-range-border-width);  /* = 1px */
  ```
- **Эффект:** **Range button сдвигается вниз на 1 пиксель** (padding внутри wrapper).

### 🔴 **Причина #3: `margin-top: -1px` на button при OPEN**
- **Файл:** [ChartToolbar.dropdown.css](toolbar/dropdown/ChartToolbar.dropdown.css#L81)
- **Селектор:** `.chart-container [data-role="compact-toolbar"] .tb-range[data-state="open"] .tb-btn--range`
- **Строка:** 81
- **Свойство:**
  ```css
  margin-top: calc(-1 * var(--tb-dropdown-range-border-width));  /* = -1px */
  ```
- **Эффект:** Пытается **откомпенсировать** `padding-top: 1px`, но **компенсирует избыточно** — итого micro-shift.

---

## 6. Математика shift-а

```
CLOSED state (baseline):
  .tb-range: padding = 0, margin = 0
  .tb-btn--range: margin-top = 0, position = relative (in flow)
  Visual Y = 0px

OPEN state (current):
  .tb-range: 
    - position: absolute → removes from flow
    - padding-top: 1px → **internal space INSIDE wrapper**
  .tb-btn--range:
    - margin-top: -1px → **tries to compensate, but...**
  
  Net effect on button visual position:
    wrapper[padding-top] + button[margin-top] = 1px + (-1px) = 0px compensation attempt
    BUT: padding-top pushes ALL content inside wrapper DOWN by 1px
    Then margin-top: -1px pulls button UP by 1px
    Result at OPEN: micro-glitch in rendering/layout recalculation
```

---

## 7. CSS токены (для справки)

```css
/* ChartToolbar.tokens.css */
--tb-dropdown-offset: 4px;
--tb-range-border-width: 1px;
--tb-dropdown-range-border-width: 1px;
--tb-range-height: 36px;
--tb-range-radius: 12px;
--tb-dropdown-range-radius: 14px;
--tb-dropdown-range-bg: #20252e;
--tb-dropdown-range-shadow: 0 10px 26px rgba(0, 0, 0, 0.35);
--tb-dropdown-range-padding: 6px;
```

---

## 8. Точка правки (CRITICAL)

**Минимальное решение — убрать `padding-top` из wrapper + пересчитать button margin:**

### Файл 1: [fingineerwebapp/src/components/Results/Chart/toolbar/dropdown/ChartToolbar.dropdown.css](toolbar/dropdown/ChartToolbar.dropdown.css)

**Селектор:** `.chart-container [data-role="compact-toolbar"] .tb-range[data-state="open"]`

**Строка 72 — УДАЛИТЬ:**
```css
padding-top: var(--tb-dropdown-range-border-width);  /* REMOVE THIS */
```

**Селектор button:** `.chart-container [data-role="compact-toolbar"] .tb-range[data-state="open"] .tb-btn--range`

**Строка 81 — УДАЛИТЬ:**
```css
margin-top: calc(-1 * var(--tb-dropdown-range-border-width));  /* REMOVE THIS */
```

**Result:** Button останется на одном уровне с Expand-кнопкой и sparkline при открытии dropdown.

---

## 9. Корневая причина

Wrapper с `position: absolute + padding-top` создает **двойную регулировку позиции:**
1. Padding толкает контент вниз (box model)
2. Margin-top пытается компенсировать (flow adjustment)

При переходе CLOSED → OPEN браузер **пересчитывает layout** и может показать micro-glitch от этой борьбы свойств.

**Решение:** Убрать обе компенсирующие свойства. Absolute positioning уже удаляет wrapper из потока, поэтому padding/margin не нужны для выравнивания.

---

## 10. Проверка после правки

- [ ] Откроешь Range → Range control НЕ движется вниз
- [ ] Expand кнопка остается на месте (не прыгает)
- [ ] Sparkline остается на месте
- [ ] Dropdown визуально выглядит как одно целое с кнопкой
- [ ] Закрытие/открытие работает без глюков
- [ ] На zoom 200%+ нет видимых сдвигов
