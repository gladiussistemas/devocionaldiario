import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Logout,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const drawerWidthExpanded = 240;
const drawerWidthCollapsed = 64;

// Custom SVG Icons
const DashboardCustomIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M21,7.5c0,.276-.224,.5-.5,.5h-3c-.276,0-.5-.224-.5-.5s.224-.5,.5-.5h3c.276,0,.5,.224,.5,.5Zm-.5,2.5h-3c-.276,0-.5,.224-.5,.5s.224,.5,.5,.5h3c.276,0,.5-.224,.5-.5s-.224-.5-.5-.5Zm0,3h-3c-.276,0-.5,.224-.5,.5s.224,.5,.5,.5h3c.276,0,.5-.224,.5-.5s-.224-.5-.5-.5Zm0,3h-3c-.276,0-.5,.224-.5,.5s.224,.5,.5,.5h3c.276,0,.5-.224,.5-.5s-.224-.5-.5-.5Zm3.5-8.5v9c0,2.481-2.019,4.5-4.5,4.5H4.5c-2.481,0-4.5-2.019-4.5-4.5V7.5C0,5.019,2.019,3,4.5,3h15c2.481,0,4.5,2.019,4.5,4.5Zm-1,0c0-1.93-1.57-3.5-3.5-3.5H4.5c-1.93,0-3.5,1.57-3.5,3.5v9c0,1.93,1.57,3.5,3.5,3.5h15c1.93,0,3.5-1.57,3.5-3.5V7.5Zm-8,4.5c0,3.309-2.691,6-6,6s-6-2.691-6-6,2.691-6,6-6,6,2.691,6,6Zm-6,5c1.198,0,2.284-.441,3.146-1.146l-3.207-3.207c-.283-.283-.439-.66-.439-1.061V7.051c-2.52,.255-4.5,2.364-4.5,4.949,0,2.757,2.243,5,5,5Zm5-5c0-2.586-1.98-4.694-4.5-4.949v4.535c0,.131,.054,.26,.146,.354l3.207,3.207c.706-.862,1.147-1.948,1.147-3.147Z"/>
  </svg>
);

const DevotionalCustomIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="m17.5,0H6.5C4.019,0,2,2.019,2,4.5v16c0,1.93,1.57,3.5,3.5,3.5h12c2.481,0,4.5-2.019,4.5-4.5V4.5c0-2.481-2.019-4.5-4.5-4.5ZM3,4.5c0-1.93,1.57-3.5,3.5-3.5h11c1.93,0,3.5,1.57,3.5,3.5v12.5H5.5c-.98,0-1.864.407-2.5,1.058V4.5Zm14.5,18.5H5.5c-1.378,0-2.5-1.121-2.5-2.5s1.122-2.5,2.5-2.5h15.5v1.5c0,1.93-1.57,3.5-3.5,3.5Zm-6.604-9.391c.325.262.715.392,1.104.392s.779-.13,1.104-.392c1.171-.942,3.896-3.374,3.896-5.614,0-1.652-1.233-2.996-2.75-2.996-.938,0-1.768.493-2.274,1.248-.486-.76-1.294-1.248-2.226-1.248-1.517,0-2.75,1.344-2.75,2.996,0,2.24,2.724,4.672,3.896,5.614Zm-1.146-7.609c.959,0,1.711.86,1.711,1.958,0,.276.224.5.5.5s.5-.224.5-.5c0-1.08.802-1.958,1.789-1.958.965,0,1.75.895,1.75,1.996,0,1.476-1.819,3.465-3.522,4.834-.281.226-.674.226-.955,0-1.703-1.369-3.522-3.358-3.522-4.834,0-1.101.785-1.996,1.75-1.996Z"/>
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M12.649,12L21.886,.818c.176-.213,.146-.528-.067-.704-.211-.176-.526-.147-.704,.067L12,11.215,2.886,.182c-.178-.215-.493-.243-.704-.067-.213,.176-.243,.491-.067,.704L11.351,12,2.114,23.182c-.176,.213-.146,.528,.067,.704,.212,.175,.527,.147,.704-.067L12,12.785l9.114,11.033c.177,.214,.493,.242,.704,.067,.213-.176,.243-.491,.067-.704L12.649,12Z"/>
  </svg>
);

const HamburgerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M24,12c0,.276-.224,.5-.5,.5H.5c-.276,0-.5-.224-.5-.5s.224-.5,.5-.5H23.5c.276,0,.5,.224,.5,.5ZM.5,5H23.5c.276,0,.5-.224,.5-.5s-.224-.5-.5-.5H.5c-.276,0-.5,.224-.5,.5s.224,.5,.5,.5Zm23,14H.5c-.276,0-.5,.224-.5,.5s.224,.5,.5,.5H23.5c.276,0,.5-.224,.5-.5s-.224-.5-.5-.5Z"/>
  </svg>
);

const DevonAIIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="m19,11.5v7c0,.276-.224.5-.5.5s-.5-.224-.5-.5v-7c0-.276.224-.5.5-.5s.5.224.5.5Zm4.5-2.5c-.276,0-.5.224-.5.5v10c0,1.93-1.57,3.5-3.5,3.5H4.5c-1.93,0-3.5-1.57-3.5-3.5V4.5c0-1.93,1.57-3.5,3.5-3.5h10c.276,0,.5-.224.5-.5s-.224-.5-.5-.5H4.5C2.019,0,0,2.019,0,4.5v15c0,2.481,2.019,4.5,4.5,4.5h15c2.481,0,4.5-2.019,4.5-4.5v-10c0-.276-.224-.5-.5-.5Zm-8.677-4.783l2.83-1.071,1.133-2.832c.152-.38.776-.38.929,0l1.135,2.836,2.836,1.135c.19.076.314.26.314.464s-.125.388-.314.464l-2.836,1.135-1.135,2.836c-.076.19-.26.314-.464.314s-.388-.125-.464-.314l-1.137-2.842-2.843-1.198c-.188-.08-.31-.266-.306-.47s.132-.386.323-.458Zm1.523.493l1.884.794c.123.052.22.151.27.275l.75,1.875.75-1.875c.051-.127.151-.228.279-.279l1.875-.75-1.875-.75c-.127-.051-.228-.151-.279-.279l-.75-1.875-.75,1.875c-.052.13-.156.232-.288.282l-1.866.706Zm-5.154,1.531l3.785,12.111c.083.263-.064.544-.328.626-.049.016-.1.023-.149.023-.213,0-.41-.137-.477-.351l-1.14-3.649h-6.765l-1.14,3.649c-.083.264-.364.411-.626.328-.264-.082-.411-.363-.328-.626l3.785-12.111c.236-.756.901-1.245,1.692-1.245h0c.792,0,1.456.489,1.692,1.245Zm1.378,7.76l-2.332-7.462c-.125-.4-.463-.542-.738-.542h0c-.275,0-.613.143-.738.543l-2.332,7.461h6.14Z"/>
  </svg>
);

const menuItems = [
  { text: 'Dashboard', icon: <DashboardCustomIcon />, path: '/dashboard' },
  { text: 'Devocionais', icon: <DevotionalCustomIcon />, path: '/devotionals' },
  { text: 'Devon IA', icon: <DevonAIIcon />, path: '/devon-ai' },
];

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const drawer = (
    <div>
      <Toolbar sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: '64px !important',
        height: '64px',
        py: 0.5
      }}>
        {sidebarOpen && (
          <Box sx={{ display: 'flex', alignItems: 'center', pl: 1 }}>
            <img
              src="/logo.svg"
              alt="Devocional Diário"
              style={{ height: '100px', width: 'auto' }}
            />
          </Box>
        )}
        <IconButton onClick={handleSidebarToggle} sx={{ display: { xs: 'none', sm: 'block' }, mr: -1 }}>
          {sidebarOpen ? <CloseIcon /> : <HamburgerIcon />}
        </IconButton>
      </Toolbar>
      <Box sx={{
        height: '1px',
        backgroundColor: 'divider',
        boxShadow: '0px 4px 10px -2px rgba(0,0,0,0.4), 0px 8px 12px 0px rgba(0,0,0,0.3), 0px 3px 20px 0px rgba(0,0,0,0.25)',
        position: 'relative',
        zIndex: 1
      }} />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <Tooltip title={!sidebarOpen ? item.text : ''} placement="right">
              <ListItemButton onClick={() => handleNavigation(item.path)}>
                <ListItemIcon sx={{ minWidth: sidebarOpen ? 56 : 'auto', justifyContent: 'center' }}>
                  {item.icon}
                </ListItemIcon>
                {sidebarOpen && <ListItemText primary={item.text} />}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>
    </div>
  );

  const drawerWidth = sidebarOpen ? drawerWidthExpanded : drawerWidthCollapsed;

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          transition: 'width 0.3s, margin 0.3s',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Painel Administrativo
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2">{user?.full_name || user?.username}</Typography>
            <IconButton onClick={handleMenu} color="inherit">
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                {user?.username?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
              <MenuItem disabled>
                <Typography variant="body2" color="text.secondary">
                  {user?.email}
                </Typography>
              </MenuItem>
              <MenuItem disabled>
                <Typography variant="caption" color="text.secondary">
                  Role: {user?.role}
                </Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <Logout fontSize="small" />
                </ListItemIcon>
                Sair
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidthExpanded },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              transition: 'width 0.3s',
              overflowX: 'hidden',
            },
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
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          transition: 'width 0.3s',
          backgroundColor: (theme) =>
            theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[900],
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
