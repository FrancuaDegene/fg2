import React from 'react';
import './LoadingSkeleton.css';

const LoadingSkeleton = () => {
  return (
    <div className="skeleton-container">
      <div className="skeleton-header" />
      <div className="skeleton-block" />
      <div className="skeleton-block" />
    </div>
  );
};

export default LoadingSkeleton;
