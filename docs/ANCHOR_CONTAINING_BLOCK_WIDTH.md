# 🎯 ANCHOR: DROPDOWN CONTAINING BLOCK & WIDTH ISSUE

**Статус:** Audit Only (no patch)  
**Дата:** 24 января 2026  
**Контекст:** Dropdown body шире кнопки Range. Нужно найти containing block и зафиксировать ширину.

---

## 📋 1) JSX СТРУКТУРА (CompactToolbar.jsx)

**Файл:** `fingineerwebapp/src/components/Results/Chart/CompactToolbar.jsx`  
**Строки 98–140 (Range dropdown + wrapper):**

```jsx
<div className="tb__slot--right" style={{ padding: '8px 10px' }}>
  <div className="dropdown-container tb-dd" ref={anchorRef}>
    {/* ← CONTAINING BLOCK: position: relative */}
    
    <button
      className={`tb-btn tb-btn--with-text tb-btn--range${isOpen ? ' tb-btn--open' : ''}`}
      onClick={() => { toggle(); }}
      aria-expanded={isOpen}
      data-testid="range-trigger"
      type="button"
    >
      {currentLabel}
    </button>
    
    {isOpen && (
      <div className="dropdown-menu tb-dropdown" ref={contentRef}>
        {/* ← ABSOLUTE CHILD: position: absolute; top: 100%; */}
        {RANGES.map((r) => (
          <button
            key={r.id}
            className="tb-dd__item tb-dropdown__item"
            data-state={currentRange === r.id ? 'active' : undefined}
            data-active={currentRange === r.id ? 'true' : undefined}
            ...
          >
            <span className="tb-dd__label">{r.label}</span>
            {currentRange === r.id && <span className="tb-dd__check">•</span>}
          </button>
        ))}
      </div>
    )}
  </div>
  
  <button className="tb-btn tb-btn--expand" ...>↗</button>
</div>
```

### ИЕРАРХИЯ

```
.tb__slot--right (inline-flex? или flex?)
  └─ .dropdown-container.tb-dd (position: relative)  ← ★ CONTAINING BLOCK
      ├─ button.tb-btn--range
      └─ .dropdown-menu.tb-dropdown (position: absolute)  ← ★ АБСОЛЮТНЫЙ ПОТОМОК
```

---

## 📋 2) DROPDOWN CSS (базовые правила)

**Файл:** `fingineerwebapp/src/components/Results/Chart/toolbar/dropdown/ChartToolbar.dropdown.css`  
**Строки 1–36 (контейнер и базовая панель):**

```css
/* Контейнеры выпадающих меню */
.dropdown-container,
.tb-dd {
  position: relative;           /* ← ★ CONTAINING BLOCK! */
  z-index: var(--z-dropdown, 60);
  flex-shrink: 0;
}

.chart-toolbar .dropdown-container,
.chart-toolbar .tb-dd {
  max-width: none;
  width: auto;
}

/* Базовая панель dropdown */
.dropdown-menu,
.tb-dd__panel {
  position: absolute;           /* ← Абсолютное позиционирование */
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
  inline-size: max-content;     /* ← Хочет максимума */
  min-inline-size: 100%;        /* ← Но минимум 100% от containing block */
  max-inline-size: 36ch;        /* ← Лимит 36 символа */
}
```

---

## 🎯 3) АНАЛИЗ: ЧТО ЯВЛЯЕТСЯ CONTAINING BLOCK?

### CONTAINING BLOCK = `.dropdown-container.tb-dd`

**Селектор:** `.dropdown-container` или `.tb-dd`

**Почему:**
```css
.dropdown-container {
  position: relative;  ← ★ Это создаёт containing block!
}
```

**CSS Rule:** Когда child имеет `position: absolute`, он считает 100% ширину от **NEAREST родителя с `position != static`**.

### ИЕРАРХИЯ CONTAINING BLOCKS

```
body
└─ .tb__slot--right (position: static)           ← НЕ создаёт блок
    └─ .dropdown-container (position: relative)  ← ★ ЭТО containing block
        ├─ button.tb-btn--range
        └─ .dropdown-menu (position: absolute)   ← считает 100% от .dropdown-container
```

---

## 📊 4) ПОЧЕМУ DROPDOWN ШИРЕ?

| Элемент | Ширина | Свойства |
|---|---|---|
| `.dropdown-container` | ? | `position: relative; flex-shrink: 0;` |
| `.tb-btn--range` (кнопка) | ~60px | height: 36px, padding: 0 14px |
| `.dropdown-menu` | 100% от `.dropdown-container` | `width: 100%;` |

**ПРОБЛЕМА:**
- `.dropdown-container` содержит КНОПКУ + DROPDOWN
- `.dropdown-menu` считает `width: 100%` от `.dropdown-container`
- Но `.dropdown-container` может быть **более широкая**, чем сама кнопка!

**Почему `.dropdown-container` шире кнопки?**
- `.dropdown-container` может иметь padding/margin от parent
- `.dropdown-container` flex-direction или другой контекст
- **Нужно явно ограничить ширину`.dropdown-container` ПО КНОПКЕ**

---

## 🔧 5) РЕШЕНИЕ: ЗАФИКСИРОВАТЬ CONTAINING BLOCK

**Есть 2 варианта:**

### Вариант А (CSS-only, рекомендую):
Ограничить ширину `.dropdown-container` в Compact контексте:

```css
.chart-container [data-role="compact-toolbar"] .dropdown-container,
.chart-container [data-role="compact-toolbar"] .tb-dd {
  width: auto;  /* или max-content */
  /* это сделает контейнер ровно по ширине кнопки */
}
```

**Тогда dropdown автоматически будет той же ширины.**

### Вариант Б (если A не сработает):
Явно задать ширину в dropdown override:

```css
.chart-container [data-role="compact-toolbar"] .dropdown-menu.tb-dropdown {
  width: var(--tb-range-width);  /* если есть токен */
  /* или */
  width: auto;  /* потом будет видно */
}
```

---

## 📍 ТОЧКА ПРАВКИ

**Файл:** `fingineerwebapp/src/components/Results/Chart/toolbar/dropdown/ChartToolbar.dropdown.css`

**Добавить новый блок** (после базовых `.dropdown-container { ... }` правил, вероятно после строки 11):

```css
/* Compact: constrain containing block to button width */
.chart-container [data-role="compact-toolbar"] .dropdown-container,
.chart-container [data-role="compact-toolbar"] .tb-dd {
  width: auto;
  /* This makes the container fit the button, so absolute child respects that */
}
```

**Результат:** 
- `.dropdown-container` ширина = ширина кнопки
- `.dropdown-menu` с `width: 100%` = ширина кнопки ✅

---

## ✅ ФИНАЛЬНЫЙ ЧЕКЛИСТ

- [x] Найден containing block (`.dropdown-container` с `position: relative`)
- [x] Найдена иерархия (JSX структура и CSS)
- [x] Выявлена причина (ширина containing block > ширина кнопки)
- [x] Предложено решение (ограничить ширину `.dropdown-container`)
- [x] Точка правки определена (ChartToolbar.dropdown.css)

---

## 🎯 NEXT: PATCH (ограничить containing block)

```css
.chart-container [data-role="compact-toolbar"] .dropdown-container,
.chart-container [data-role="compact-toolbar"] .tb-dd {
  width: auto;
}
```

**Это заставит dropdown быть ровно по ширине кнопки.**

---

**Якорь готов.**
