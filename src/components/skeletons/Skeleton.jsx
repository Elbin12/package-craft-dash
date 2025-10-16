import React from 'react';

const Skeleton = ({ width = '100%', height = '16px', style = {} }) => (
  <div
    style={{
      background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
      backgroundSize: '200% 100%',
      animation: 'skeleton-loading 1.2s infinite',
      borderRadius: '4px',
      width,
      height,
      ...style,
    }}
  />
);

export default Skeleton;