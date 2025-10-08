// src/components/Overlay/Overlay.js
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Универсальный оверлей.
 * - variant="backdrop": только фон (как .search-overlay в App)
 * - variant="modal": фон + контейнер контента (как .search-modal-overlay/.search-modal-content)
 * По умолчанию классы оставляем прежними, чтобы стили не поменялись.
 */
function Overlay({
  isOpen,
  variant = 'backdrop',
  backdropClassName,
  contentClassName,
  onBackdropClick,
  role = 'dialog',
  children,
}) {
  if (!isOpen) return null;

  const backdropCls =
    backdropClassName ||
    (variant === 'modal' ? 'search-modal-overlay' : 'search-overlay');

  const contentCls =
    contentClassName ||
    (variant === 'modal' ? 'search-modal-content' : '');

  const handleClick = onBackdropClick
    ? (e) => {
        if (e.target === e.currentTarget) onBackdropClick(e);
      }
    : undefined;

  // ВАЖНО: не используем порталы, рендерим inline — z-index остаются как в текущих CSS
  return (
    <div className={backdropCls} onClick={handleClick}>
      {variant === 'modal' ? (
        <div className={contentCls} role={role} aria-modal={role === 'dialog'}>
          {children}
        </div>
      ) : null}
    </div>
  );
}

Overlay.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  variant: PropTypes.oneOf(['backdrop', 'modal']),
  backdropClassName: PropTypes.string,
  contentClassName: PropTypes.string,
  onBackdropClick: PropTypes.func,
  role: PropTypes.string,
  children: PropTypes.node,
};

export default Overlay;