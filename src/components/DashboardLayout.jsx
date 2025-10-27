import { Menu, X } from 'lucide-react';
import { useNavigation } from '../contexts/NavigationContext';
import { useSwipeGesture } from '../hooks/useSwipeGesture';
import Sidebar from './Sidebar';

export default function DashboardLayout({ children, sidebarStats }) {
  const { isSidebarOpen, toggleSidebar, closeSidebar } = useNavigation();
  
  // Swipe gesture for closing sidebar
  const { handlers, isDragging } = useSwipeGesture({
    onSwipeLeft: closeSidebar,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Mobile Hamburger Button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 lg:hidden z-30 p-3 bg-gradient-to-br from-primary-600 to-secondary-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 touch-manipulation"
        aria-label="Toggle sidebar"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden touch-none"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        {...handlers}
        className={`
          sidebar-modern fixed top-0 left-0 h-screen w-[280px] 
          overflow-y-auto z-50 shadow-2xl
          transform transition-transform duration-300
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isDragging ? 'opacity-95' : ''}
          lg:translate-x-0
          touch-pan-y will-change-transform
        `}
      >
        {/* Close Button (Mobile Only) */}
        <button
          onClick={closeSidebar}
          className="absolute top-4 right-4 lg:hidden p-3 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors touch-manipulation"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>

        {/* Sidebar Content */}
        <div className="h-full">
          <Sidebar stats={sidebarStats} />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="w-full lg:ml-[280px] min-h-screen">
        {children}
      </main>
    </div>
  );
}
