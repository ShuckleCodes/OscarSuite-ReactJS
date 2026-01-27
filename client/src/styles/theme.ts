import { createTheme } from '@mui/material/styles';

// Oscar gold color palette
const oscarGold = '#C9A227';
const oscarGoldLight = '#E6C867';
const oscarGoldDark = '#8B7019';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: oscarGold,
      light: oscarGoldLight,
      dark: oscarGoldDark,
      contrastText: '#000000'
    },
    secondary: {
      main: '#2196F3',
      light: '#64B5F6',
      dark: '#1976D2'
    },
    background: {
      default: '#0a0a0a',
      paper: '#1a1a1a'
    },
    success: {
      main: '#4CAF50',
      light: '#81C784',
      dark: '#388E3C'
    },
    error: {
      main: '#f44336',
      light: '#e57373',
      dark: '#d32f2f'
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700
    },
    h2: {
      fontWeight: 600
    },
    h3: {
      fontWeight: 600
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8
        },
        contained: {
          boxShadow: '0 2px 8px rgba(201, 162, 39, 0.3)'
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundImage: 'none'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none'
        }
      }
    }
  }
});
