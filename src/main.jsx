import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import { NavigationProvider } from './contexts/NavigationContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <NavigationProvider>
        <ErrorBoundary onError={(error, errorInfo) => {
          console.error('Application Error:', error, errorInfo);
          // Could send to error tracking service in production
        }}>
          <App />
        </ErrorBoundary>
      </NavigationProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
