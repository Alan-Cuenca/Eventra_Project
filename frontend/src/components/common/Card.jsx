import React from 'react';

export const Card = ({ children, className = '', interactive = false, onClick, style, ...props }) => {
  return (
    <div
      className={`card ${interactive ? 'interactive' : ''} ${className}`}
      onClick={onClick}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
};
