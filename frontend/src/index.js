import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { red } from '@mui/material/colors';
import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    primary: {
      main: 'rgb(255,138,1)',
    },
    secondary: {
      main: '#14d890',
    },
    error: {
      main: red.A400,
    },
    background: {
      default: '#fafafa',
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
