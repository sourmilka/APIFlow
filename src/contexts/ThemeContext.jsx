import { createContext, useContext } from 'react';

const ThemeContext = createContext({
  theme: 'dark',
  isDark: true,
  toggleTheme: () => {}, // No-op: theme is fixed
});

export const ThemeProvider = ({ children }) => {
  // Fixed theme - always dark with custom colors (#1D1D1D, #E6FFD7, #333333)
  const value = {
    theme: 'dark',
    isDark: true,
    toggleTheme: () => {}, // No-op: theme switching disabled
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
