'use client';

import { useAuth } from '@/context/AuthContext';
import { useSalon } from '@/context/SalonContext';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon as MuiListItemIcon,
  FormControl,
  Select,
  InputLabel,
} from '@mui/material';
import {
  Store,
  Dashboard,
  Schedule,
  Person,
  Menu as MenuIcon,
  Logout,
  Settings,
  Email,
  EventBusy,
  Face,
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';

const drawerWidth = 240;

const menuItems = [
  { text: 'Services', icon: <Face />, path: '/bms/service-groups' },
  { text: 'Promotions', icon: <Dashboard />, path: '/bms/promotions' },
  { text: 'Reservations', icon: <Schedule />, path: '/bms/reservations' },
  { text: 'Mailing System', icon: <Email />, path: '/bms/mailing-system' },
  { text: 'Open Hours Exceptions', icon: <EventBusy />, path: '/bms/open-hours-exceptions' },
  { text: 'Account', icon: <Person />, path: '/bms/account' },
  { text: 'Salon Settings', icon: <Settings />, path: '/bms/salon-settings' },
];

export default function BMSLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { activeSalon, salons, setActiveSalon } = useSalon();
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleProfileMenuClose();
    await logout();
  };

  const handleSalonChange = (salonId: string) => {
    const selectedSalon = salons.find(salon => salon.id === salonId);
    if (selectedSalon) {
      setActiveSalon(selectedSalon);
    }
    handleProfileMenuClose();
  };

  const handleAddSalon = () => {
    handleProfileMenuClose();
    router.push('/bms/salons/new');
  };



  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          {activeSalon ? activeSalon.name : 'Business Panel'}
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={pathname === item.path}
              onClick={() => {
                router.push(item.path);
                if (isMobile) {
                  setMobileOpen(false);
                }
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
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
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find(item => item.path === pathname)?.text || 'Business Panel'}
          </Typography>
          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-controls="primary-search-account-menu"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <Avatar sx={{ width: 32, height: 32 }}>
              {user?.firstName?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
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
        }}
      >
        <Toolbar />
        {children}
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
      >
        <MenuItem>
          <Typography variant="body2">
            {user?.firstName} {user?.lastName}
          </Typography>
        </MenuItem>
        <MenuItem>
          <Typography variant="body2" color="text.secondary">
            {user?.email}
          </Typography>
        </MenuItem>
        <Divider />
        <MenuItem>
          <FormControl fullWidth size="small">
            <InputLabel>Active Salon</InputLabel>
            <Select
              value={activeSalon?.id || ''}
              onChange={(e) => handleSalonChange(e.target.value)}
              label="Active Salon"
              onClick={(e) => e.stopPropagation()}
            >
              {salons.map((salon) => (
                <MenuItem key={salon.id} value={salon.id}>
                  {salon.name} - {salon.city}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleAddSalon}>
          <MuiListItemIcon>
            <Store fontSize="small" />
          </MuiListItemIcon>
          Add Salon
        </MenuItem>

        <MenuItem onClick={handleLogout}>
          <MuiListItemIcon>
            <Logout fontSize="small" />
          </MuiListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </Box>
  );
}