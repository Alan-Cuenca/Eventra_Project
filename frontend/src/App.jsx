import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeBrandingProvider } from './context/ThemeBrandingContext';
import { AppRoutes } from './routes/AppRoutes';
import { GlobalPlanLimitToast } from './components/ui/GlobalPlanLimitToast';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ThemeBrandingProvider>
            <GlobalPlanLimitToast />
            <AppRoutes />
          </ThemeBrandingProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
