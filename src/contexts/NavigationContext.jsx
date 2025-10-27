import { createContext, useContext, useState, useEffect } from 'react';

const NavigationContext = createContext();

export function NavigationProvider({ children }) {
  const [activeSection, setActiveSection] = useState(() => {
    // Initialize from localStorage or default to 'apis'
    const saved = localStorage.getItem('activeSection');
    return saved || 'apis';
  });
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Persist active section to localStorage
  useEffect(() => {
    localStorage.setItem('activeSection', activeSection);
  }, [activeSection]);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const value = {
    activeSection,
    setActiveSection,
    isSidebarOpen,
    toggleSidebar,
    closeSidebar
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
