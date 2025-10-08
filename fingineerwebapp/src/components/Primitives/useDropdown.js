// src/components/Primitives/useDropdown.js
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Универсальный контроллер для выпадающих меню.
 * Закрывает меню по клику снаружи, ESC, scroll и resize.
 * Не меняет разметку/классы — только отдаёт refs и колбэки.
 */
export default function useDropdown(initialOpen = false) {
  const [isOpen, setIsOpen] = useState(Boolean(initialOpen));
  const anchorRef = useRef(null);
  const contentRef = useRef(null);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  useEffect(() => {
    if (!isOpen) return;

    const onClick = (e) => {
      const a = anchorRef.current;
      const c = contentRef.current;
      if (!a || !c) return;
      const target = e.target;
      // если клик вне якоря и вне контента — закрываем
      if (!a.contains(target) && !c.contains(target)) {
        setIsOpen(false);
      }
    };

    const onKey = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    const onScrollOrResize = () => setIsOpen(false);

    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);

    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [isOpen]);

  return {
    isOpen,
    open,
    close,
    toggle,
    anchorRef,
    contentRef,
  };
}