import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { red } from '@mui/material/colors';
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#FC5D0D',
    },
    secondary: {
      main: '#000',
    },
    error: {
      main: red.A400,
    },
    background: {
      default: '#F7F7F7',
    },
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily: '"IBM Plex Sans", Arial, sans-serif',
    h5: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
          padding: '8px 20px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: 'rgba(38, 208, 124, 0.1)',
            '&:hover': {
              backgroundColor: 'rgba(38, 208, 124, 0.15)',
            },
          },
        },
      },
    },
  },
});

const root = createRoot(document.querySelector('#root'));
root.render(
<ThemeProvider theme={theme}>
  <CssBaseline />
  <App />
</ThemeProvider>
);
