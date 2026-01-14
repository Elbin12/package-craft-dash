import React from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  BusinessCenter,
  LocationOn,
  QuestionAnswer,
  Settings,
  DiscountOutlined,
  LocationOnRounded,
  LocationOnOutlined,
  BusinessCenterOutlined,
  AnalyticsOutlined,
  People,
  Block,
} from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Calculator, House, ListPlus } from 'lucide-react';

const drawerWidth = 280;

// AdminLayout component props: { children }

// Define all menu items with their permission requirements
const allMenuItems = [
  { text: 'Dashboard', icon: Dashboard, path: '/admin', permission: 'can_access_dashboard' },
  { text: 'Users', icon: People, path: '/admin/users', permission: null, requiresSuperAdmin: true },
  { text: 'Reports', icon: AnalyticsOutlined, path: '/admin/reports', permission: 'can_access_reports' },
  { text: 'Service Management', icon: BusinessCenterOutlined, path: '/admin/services', permission: 'can_access_service_management' },
  { text: 'Location Management', icon: LocationOnOutlined, path: '/admin/locations', permission: 'can_access_location' },
  { text: 'House Size Info', icon: House, path: '/admin/house-size-info', permission: 'can_access_house_size_management' },
  { text: 'Add-On Services', icon: ListPlus , path: '/admin/add-on/services', permission: 'can_access_addon_service' },
  { text: 'Coupons', icon: DiscountOutlined , path: '/admin/coupons', permission: 'can_access_coupon' },
  { text: 'On the Go Calculator', icon: Calculator , path: '/admin/on-the-go-calculator', permission: 'can_access_on_the_go_calculator' },
  // { text: 'Settings', icon: Settings, path: '/admin/settings' },
];

export const AdminLayout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get user data from Redux store
  const user = useSelector((state) => state.auth.user);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Filter menu items based on user permissions
  const getFilteredMenuItems = () => {
    if (!user) return [];

    return allMenuItems.filter((item) => {
      // Check if item requires super admin
      if (item.requiresSuperAdmin && !user.is_super_admin) {
        return false;
      }

      // If no permission required, show it (e.g., Dashboard for all authenticated users)
      if (!item.permission) {
        return true;
      }

      // Check if user has the required permission
      return user[item.permission] === true;
    });
  };

  const menuItems = getFilteredMenuItems();

  // Check if current route is accessible
  const isRouteAccessible = (path) => {
    const menuItem = allMenuItems.find((item) => item.path === path);
    if (!menuItem) return true; // Allow unknown routes (might be handled elsewhere)

    if (!user) return false;

    // Check super admin requirement
    if (menuItem.requiresSuperAdmin && !user.is_super_admin) {
      return false;
    }

    // Check permission requirement
    if (menuItem.permission && !user[menuItem.permission]) {
      return false;
    }

    return true;
  };

  // Check if current route is accessible
  const currentRouteAccessible = isRouteAccessible(location.pathname);

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" className="text-primary font-bold">
          Admin Panel
        </Typography>
      </Toolbar>
      <List>
        {menuItems.length === 0 ? (
          <ListItem>
            <Box sx={{ p: 2, textAlign: 'center', width: '100%' }}>
              <Block sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No accessible sections
              </Typography>
            </Box>
          </ListItem>
        ) : (
          menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
                className="mx-2 rounded-lg"
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'hsl(var(--primary) / 0.1)',
                    color: 'hsl(var(--primary))',
                    '&:hover': {
                      backgroundColor: 'hsl(var(--primary) / 0.15)',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{minWidth: 40, color: location.pathname === item.path ? 'hsl(var(--primary))' : 'inherit' }}>
                  <item.icon />
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))
        )}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: 'hsl(var(--background))',
          color: 'hsl(var(--foreground))',
          boxShadow: 'var(--shadow-sm)',
          borderBottom: '1px solid hsl(var(--border))',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Service Booking Management
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="admin navigation"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          marginTop: '64px',
          backgroundColor: 'hsl(var(--muted) / 0.3)',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        {!currentRouteAccessible ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '60vh',
              textAlign: 'center',
              p: 4,
            }}
          >
            <Block sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom fontWeight="bold">
              Access Denied
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 500 }}>
              You don't have permission to access this section. Please contact your administrator if you believe this is an error.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
              {menuItems.length > 0 && (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ width: '100%' }}>
                    Available sections:
                  </Typography>
                  {menuItems.map((item) => (
                    <Box
                      key={item.text}
                      onClick={() => navigate(item.path)}
                      sx={{
                        px: 2,
                        py: 1,
                        borderRadius: 1,
                        border: 1,
                        borderColor: 'divider',
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                          borderColor: 'primary.main',
                        },
                      }}
                    >
                      <Typography variant="body2">{item.text}</Typography>
                    </Box>
                  ))}
                </>
              )}
            </Box>
          </Box>
        ) : (
          children
        )}
      </Box>
    </Box>
  );
};