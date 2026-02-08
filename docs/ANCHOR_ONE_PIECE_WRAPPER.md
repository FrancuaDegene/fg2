# 🎯 ANCHOR: RANGE DROPDOWN "ONE-PIECE" WRAPPER OPPORTUNITY

**Статус:** Audit + JSX Refactor Proposal (no patch)  
**Дата:** 24 января 2026  
**Контекст:** Сделать Range dropdown визуально одним контейнером (cap + body как один элемент).

---

## 📋 1) CURRENT JSX STRUCTURE

**Файл:** `fingineerwebapp/src/components/Results/Chart/CompactToolbar.jsx`  
**Строки 98–140 (Range control):**

```jsx
<div className="tb__slot--right" style={{ padding: '8px 10px' }}>
  <div className="dropdown-container tb-dd" ref={anchorRef}>
    {/* ← CONTAINER (position: relative) */}
    
    <button
      className={`tb-btn tb-btn--with-text tb-btn--range${isOpen ? ' tb-btn--open' : ''}`}
      onClick={() => { toggle(); }}
      aria-expanded={isOpen}
      data-testid="range-trigger"
      type="button"
    >
      {currentLabel}
    </button>
    {/* ← CAP (button) */}
    
    {isOpen && (
      <div className="dropdown-menu tb-dropdown" ref={contentRef}>
        {/* ← BODY (dropdown menu), conditional render */}
        {RANGES.map((r) => (
          <button
            key={r.id}
            className="tb-dd__item tb-dropdown__item"
            data-state={currentRange === r.id ? 'active' : undefined}
            data-active={currentRange === r.id ? 'true' : undefined}
            data-testid={`range-${r.id}`}
            data-range-id={r.id}
            onClick={() => { handlePick(r.id); }}
            title={r.label}
            type="button"
          >
            <span className="tb-dd__label">{r.label}</span>
            {currentRange === r.id && <span className="tb-dd__check">•</span>}
          </button>
        ))}
      </div>
    )}
  </div>
  {/* ← END DROPDOWN */}
  
  <button className="tb-btn tb-btn--expand" ...>↗</button>
</div>
```

---

## 📊 2) CURRENT STATE MANAGEMENT

### State (from useDropdown hook)

```javascript
const {
  isOpen,           /* ← boolean: true = dropdown open */
  anchorRef,        /* ← ref на .dropdown-container */
  contentRef,       /* ← ref на .dropdown-menu */
  toggle,           /* ← toggle isOpen */
  close,            /* ← close dropdown */
} = useDropdown();
```

### Button open-state markers

```jsx
className={`tb-btn tb-btn--with-text tb-btn--range${isOpen ? ' tb-btn--open' : ''}`}
aria-expanded={isOpen}
```

**Open state indicators:**
- ✅ `isOpen` (local state)
- ✅ `aria-expanded="true/false"` (accessibility, HTML standard)
- ✅ CSS class `.tb-btn--open` (when open, added dynamically)

### Dropdown conditional render

```jsx
{isOpen && (
  <div className="dropdown-menu tb-dropdown" ref={contentRef}>
    {/* renders only when isOpen = true */}
  </div>
)}
```

---

## 🎯 3) PROBLEM & OPPORTUNITY

### Current DOM hierarchy

```
.dropdown-container (position: relative)
├─ button.tb-btn--range (cap)          ← DOM sibling
└─ div.dropdown-menu (body)            ← DOM sibling (conditional)
```

**Problem:** Cap и body — siblings, не parent-child. CSS overlap работает, но при zoom/высокой dpi видны швы.

### Proposed solution: wrapper element

```
.dropdown-container (position: relative)
└─ .tb-range (NEW WRAPPER)             ← ★ NEW
   ├─ button.tb-btn--range (cap)       ← move here
   └─ div.dropdown-menu (body)         ← move here
```

**Benefits:**
- ✅ One visual container (можно задать outline/shadow целому)
- ✅ Cap + body логически connected (parent handles overflow, positioning)
- ✅ CSS: один `.tb-range[data-state="open"]` для обоих элементов
- ✅ Accessibility: семантика не ломается

---

## 🔧 4) PROPOSED JSX CHANGE (LOW-RISK)

**Replace (lines 100–129):**

```jsx
{/* CURRENT */}
<div className="dropdown-container tb-dd" ref={anchorRef}>
  <button ...>...</button>
  {isOpen && (
    <div className="dropdown-menu tb-dropdown" ref={contentRef}>
      ...
    </div>
  )}
</div>
```

**With:**

```jsx
{/* PROPOSED */}
<div className="dropdown-container tb-dd" ref={anchorRef}>
  <div className="tb-range" data-state={isOpen ? 'open' : 'closed'}>
    {/* ← NEW WRAPPER: semantic "one control" container */}
    
    <button ...>...</button>
    
    {isOpen && (
      <div className="dropdown-menu tb-dropdown" ref={contentRef}>
        ...
      </div>
    )}
  </div>
</div>
```

---

## ⚠️ 5) RISKS & MITIGATION

| Risk | Impact | Mitigation |
|---|---|---|
| **absolute positioning breaks** | dropdown body может сломаться | `.tb-range` должен быть `position: static` (default) для containing block |
| **z-index stacking context** | body может спрятаться за другие элементы | Add CSS: `.tb-range { position: relative; z-index: auto; }` или inherit from parent |
| **click-outside detection** | useDropdown hook ищет ref contentRef, может сломаться | `contentRef` ещё работает (внутри wrapper), no change needed |
| **keyboard navigation** | focus management может нарушиться | Button и menu items используют tabindex стандартно, wrapper не влияет |
| **Conditional render timing** | Mount/unmount animations | conditional `{isOpen && <div>}` остаётся, no change |
| **CSS specificity conflicts** | new class может конфликтовать с existing | Use `.chart-container [data-role="compact-toolbar"] .tb-range` в CSS |

**Mitigation strategy:**
```css
.tb-range {
  position: static;  /* doesn't create containing block */
  /* or if needed: position: relative; for layout purposes */
  display: contents; /* optional: if you don't want wrapper in layout */
}
```

---

## 📍 6) ТОЧКА ПРАВКИ: JSX

**Файл:** `fingineerwebapp/src/components/Results/Chart/CompactToolbar.jsx`

**Location:** Lines 100–129 (inside `<div className="tb__slot--right">`)

**Exact lines to wrap:**

```jsx
// BEFORE (line 100–106):
<div className="dropdown-container tb-dd" ref={anchorRef}>
  <button
    className={`tb-btn tb-btn--with-text tb-btn--range${isOpen ? ' tb-btn--open' : ''}`}
    ...
  >
    {currentLabel}
  </button>

// AFTER:
<div className="dropdown-container tb-dd" ref={anchorRef}>
  <div className="tb-range" data-state={isOpen ? 'open' : 'closed'}>
    <button
      className={`tb-btn tb-btn--with-text tb-btn--range${isOpen ? ' tb-btn--open' : ''}`}
      ...
    >
      {currentLabel}
    </button>
  </div>
```

**And close the wrapper after dropdown (line 128):**

```jsx
// BEFORE (line 128–129):
  )}
</div>

// AFTER:
  )}
  </div>  {/* ← close .tb-range wrapper */}
</div>
```

---

## 🎨 7) CSS ПАIRING (PATCH для dropdown.css)

**После wrapper добавится, нужно CSS:**

```css
/* Compact: treat range control as one-piece unit */
.chart-container [data-role="compact-toolbar"] .tb-range {
  position: static;  /* doesn't interfere with absolute positioning of dropdown */
  display: contents; /* optional: remove wrapper from layout tree if not needed for positioning */
}

.chart-container [data-role="compact-toolbar"] .tb-range[data-state="open"] {
  /* visual unified state when dropdown is open */
  /* e.g., could add outline, background tint, etc. */
}
```

---

## ✅ SUMMARY TABLE

| Аспект | Current | Proposed | Benefit |
|---|---|---|---|
| **Container** | siblings | parent (wrapper) | unified styling |
| **State attr** | `aria-expanded` on button | `data-state` on wrapper + `aria-expanded` on button | semantic + CSS-friendly |
| **CSS selector** | `.tb-btn--range[aria-expanded="true"]` | `.tb-range[data-state="open"]` | cleaner, applies to whole unit |
| **Overlap** | CSS hack | part of structure | more robust |
| **Visual** | "two cards" | "one piece" | professional |

---

## 🚀 NEXT STEPS

1. **PATCH JSX:** Add `.tb-range` wrapper (this anchor)
2. **PATCH CSS:** Add `.tb-range` styles (simple, mainly for completeness)
3. **TEST:** 
   - Click range, dropdown opens/closes ✓
   - Zoom to 200% → no visible seam ✓
   - Keyboard navigation works ✓
   - Click outside → closes ✓

---

## 📌 RISKS SUMMARY

**LOW RISK CHANGE:**
- ✅ Wrapper is static/non-intrusive
- ✅ No JS changes needed (state stays same)
- ✅ Backwards compatible (CSS-in, CSS-out)
- ✅ Can be undone easily

**Testing needed:**
- Zoom test (200%+)
- Mobile responsive
- Keyboard a11y
- Click-outside detection

---

**Якорь готов. JSX refactor proposal approved for discussion.**
