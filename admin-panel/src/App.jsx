import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/Auth/PrivateRoute';
import Layout from './components/Layout/Layout';
import Login from './components/Auth/Login';
import Dashboard from './pages/Dashboard';
import Devotionals from './pages/Devotionals';
import DevotionalForm from './components/Devotionals/DevotionalForm';
import DevotionalView from './components/Devotionals/DevotionalView';
import Authors from './pages/Authors';
import AuthorForm from './components/Authors/AuthorForm';
import Themes from './pages/Themes';
import ThemeForm from './components/Themes/ThemeForm';
import DevonAI from './pages/DevonAI';

const theme = createTheme({
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 600,
  },
  palette: {
    primary: {
      main: '#ff0000',
    },
    secondary: {
      main: '#16324e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="devotionals" element={<Devotionals />} />
              <Route path="devotionals/new" element={<DevotionalForm />} />
              <Route path="devotionals/edit/:id" element={<DevotionalForm />} />
              <Route path="devotionals/view/:id" element={<DevotionalView />} />
              <Route path="authors" element={<Authors />} />
              <Route path="authors/new" element={<AuthorForm />} />
              <Route path="authors/edit/:id" element={<AuthorForm />} />
              <Route path="themes" element={<Themes />} />
              <Route path="themes/new" element={<ThemeForm />} />
              <Route path="themes/edit/:id" element={<ThemeForm />} />
              <Route path="devon-ai" element={<DevonAI />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
