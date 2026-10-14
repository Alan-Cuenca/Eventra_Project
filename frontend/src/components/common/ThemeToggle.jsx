import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Moon, Sun } from 'lucide-react';

export const ThemeToggle = ({ 
  showLabel = false, 
  floating = false, 
  className = '', 
  style = {} 
}) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      id="theme-toggle-btn"
      type="button"
      onClick={toggleTheme}
      className={`theme-toggle-btn ${floating ? 'floating' : ''} ${className}`}
      style={style}
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      aria-pressed={isDark}
    >
      <span className="theme-toggle-icon">
        {isDark ? (
          <Sun size={17} color="#F59E0B" />
        ) : (
          <Moon size={17} color="#4D7182" />
        )}
      </span>
      {showLabel && (
        <span className="theme-toggle-text">
          {isDark ? 'Modo Claro' : 'Modo Oscuro'}
        </span>
      )}
    </button>
  );
};
