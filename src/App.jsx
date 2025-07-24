import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store/index.js';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

// Import pages
import Index from "./pages/Index.jsx";
import NotFound from "./pages/NotFound.jsx";
import { AdminLayout } from './components/layouts/AdminLayout.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import ServicesManagement from './pages/admin/ServicesManagement.jsx';
import LocationsManagement from './pages/admin/LocationsManagement.jsx';
import { BookingWizard } from './components/user/BookingWizard.jsx';

// Create Material-UI theme that integrates with our design system
const theme = createTheme({
  palette: {
    primary: {
      main: 'hsl(224, 76%, 48%)',
    },
    secondary: {
      main: 'hsl(259, 70%, 55%)',
    },
    background: {
      default: 'hsl(0, 0%, 100%)',
      paper: 'hsl(0, 0%, 100%)',
    },
  },
  typography: {
    fontFamily: '"Inter", "system-ui", sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});

const queryClient = new QueryClient();

function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
        <CssBaseline />
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/booking" element={<BookingWizard />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
              <Route path="/admin/services" element={<AdminLayout><ServicesManagement /></AdminLayout>} />
              <Route path="/admin/locations" element={<AdminLayout><LocationsManagement /></AdminLayout>} />
              <Route path="/admin/questions" element={<AdminLayout><div>Questions Coming Soon</div></AdminLayout>} />
              <Route path="/admin/settings" element={<AdminLayout><div>Settings Coming Soon</div></AdminLayout>} />
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </Provider>
  );
}

export default App;