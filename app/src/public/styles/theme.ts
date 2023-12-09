import { createTheme, adaptV4Theme } from '@mui/material/styles';
// theme creator: https://bareynol.github.io/mui-theme-creator/

export const theme1 = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1e8370' // navy blue
    },
    secondary: {
      main: '#46C0A5' // light blue
    },
    background: {
      paper: '#ffffff'
    }
  }
});

export const theme2 = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1e8370'
    },
    secondary: {
      main: '#46C0A5'
    },
    background: {
      paper: '#ffffff'
    }
  }
});

export const SigninDark = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3f51b5'
    },
    secondary: {
      main: '#17a2b8'
    },
    background: {
      paper: '#ffffff'
    }
  }
});

export const SigninLight = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#3f51b5'
    },
    secondary: {
      main: '#17a2b8'
    },
    background: {
      paper: '#ffffff'
    }
  }
});
