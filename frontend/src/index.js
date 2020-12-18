import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

import { ThemeProvider } from '@material-ui/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import { red } from '@material-ui/core/colors';
import { createMuiTheme } from '@material-ui/core/styles';

const theme = createMuiTheme({
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

ReactDOM.render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <App />
  </ThemeProvider>,
  document.querySelector('#root'),
);
