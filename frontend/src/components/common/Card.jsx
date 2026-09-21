import React from 'react';

export const Card = ({ children, className = '', interactive = false, onClick, ...props }) => {
  return (
    <div
      className={`glass-card ${interactive ? 'interactive' : ''} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};
