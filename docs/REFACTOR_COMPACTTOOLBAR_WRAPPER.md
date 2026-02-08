# PATCH: Add .tb-range Wrapper to CompactToolbar.jsx

**Файл:** `fingineerwebapp/src/components/Results/Chart/CompactToolbar.jsx`

**Версия:** 1.0  
**Дата:** 24 января 2026

---

## 📝 ЧТО МЕНЯТЬ

### НАЙТИ (lines 98–130):

```jsx
      <div className="tb__slot--right" style={{ padding: '8px 10px' }}>
        <div className="dropdown-container tb-dd" ref={anchorRef}>
          <button
            className={`tb-btn tb-btn--with-text tb-btn--range${isOpen ? ' tb-btn--open' : ''}`}
            onClick={() => {
              toggle();
            }}
            aria-expanded={isOpen}
            data-testid="range-trigger"
            type="button"
          >
            {currentLabel}
          </button>
          {isOpen && (
            <div className="dropdown-menu tb-dropdown" ref={contentRef}>
              {RANGES.map((r) => (
                <button
                  key={r.id}
                  className="tb-dd__item tb-dropdown__item"
                  data-state={currentRange === r.id ? 'active' : undefined}
                  data-active={currentRange === r.id ? 'true' : undefined}
                  data-testid={`range-${r.id}`}
                  data-range-id={r.id}
                  onClick={() => {
                    handlePick(r.id);
                  }}
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

        <button
          className="tb-btn tb-btn--expand"
          onClick={handleExpand}
          title="Развернуть"
          type="button"
          aria-label="Открыть расширенный график"
          style={{ marginLeft: 8 }}
        >
          ↗
        </button>
      </div>
```

---

## ✏️ ЗАМЕНИТЬ НА:

```jsx
      <div className="tb__slot--right" style={{ padding: '8px 10px' }}>
        <div className="dropdown-container tb-dd" ref={anchorRef}>
          <div className="tb-range" data-state={isOpen ? 'open' : 'closed'}>
            <button
              className={`tb-btn tb-btn--with-text tb-btn--range${isOpen ? ' tb-btn--open' : ''}`}
              onClick={() => {
                toggle();
              }}
              aria-expanded={isOpen}
              data-testid="range-trigger"
              type="button"
            >
              {currentLabel}
            </button>
            {isOpen && (
              <div className="dropdown-menu tb-dropdown" ref={contentRef}>
                {RANGES.map((r) => (
                  <button
                    key={r.id}
                    className="tb-dd__item tb-dropdown__item"
                    data-state={currentRange === r.id ? 'active' : undefined}
                    data-active={currentRange === r.id ? 'true' : undefined}
                    data-testid={`range-${r.id}`}
                    data-range-id={r.id}
                    onClick={() => {
                      handlePick(r.id);
                    }}
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
        </div>

        <button
          className="tb-btn tb-btn--expand"
          onClick={handleExpand}
          title="Развернуть"
          type="button"
          aria-label="Открыть расширенный график"
          style={{ marginLeft: 8 }}
        >
          ↗
        </button>
      </div>
```

---

## 📊 DIFF

```diff
      <div className="tb__slot--right" style={{ padding: '8px 10px' }}>
        <div className="dropdown-container tb-dd" ref={anchorRef}>
+         <div className="tb-range" data-state={isOpen ? 'open' : 'closed'}>
            <button
              className={`tb-btn tb-btn--with-text tb-btn--range${isOpen ? ' tb-btn--open' : ''}`}
              onClick={() => {
                toggle();
              }}
              aria-expanded={isOpen}
              data-testid="range-trigger"
              type="button"
            >
              {currentLabel}
            </button>
            {isOpen && (
              <div className="dropdown-menu tb-dropdown" ref={contentRef}>
                {RANGES.map((r) => (
                  <button
                    key={r.id}
                    className="tb-dd__item tb-dropdown__item"
                    data-state={currentRange === r.id ? 'active' : undefined}
                    data-active={currentRange === r.id ? 'true' : undefined}
                    data-testid={`range-${r.id}`}
                    data-range-id={r.id}
                    onClick={() => {
                      handlePick(r.id);
                    }}
                    title={r.label}
                    type="button"
                  >
                    <span className="tb-dd__label">{r.label}</span>
                    {currentRange === r.id && <span className="tb-dd__check">•</span>}
                  </button>
                ))}
              </div>
            )}
+         </div>
        </div>

        <button
          className="tb-btn tb-btn--expand"
          onClick={handleExpand}
          title="Развернуть"
          type="button"
          aria-label="Открыть расширенный график"
          style={{ marginLeft: 8 }}
        >
          ↗
        </button>
      </div>
```

---

## ✅ ЧТО ДОБАВИЛОСЬ:

1. **Открывающий div:** `<div className="tb-range" data-state={isOpen ? 'open' : 'closed'}>`
   - Строка: после `<div className="dropdown-container tb-dd" ref={anchorRef}>`

2. **Закрывающий div:** `</div>`
   - Строка: после закрытия dropdown menu, перед `</div>` который закрывает `.dropdown-container`

---

## 🎯 РЕЗУЛЬТАТ:

**До:**
```
.dropdown-container
├─ button.tb-btn--range
└─ .dropdown-menu
```

**После:**
```
.dropdown-container
└─ .tb-range[data-state="open/closed"]
   ├─ button.tb-btn--range
   └─ .dropdown-menu
```

---

## ⚙️ ИЗМЕНЕНИЯ В JS:

**НЕТ** — никаких изменений в логике, только JSX структура!

- ✅ `isOpen`, `toggle()`, `close()` работают как раньше
- ✅ `ref={anchorRef}` остаётся на `.dropdown-container`
- ✅ `ref={contentRef}` остаётся на `.dropdown-menu`
- ✅ Все callbacks работают как раньше

---

## 🧪 ТЕСТИРОВАНИЕ:

После изменения проверь:

- [ ] Click Range button → dropdown opens ✓
- [ ] Click item → dropdown closes ✓
- [ ] Press Escape → dropdown closes ✓
- [ ] Zoom 200% → нет видимых швов между button и menu ✓
- [ ] Responsive (mobile) → работает ✓

---

**READY TO APPLY** 🚀
