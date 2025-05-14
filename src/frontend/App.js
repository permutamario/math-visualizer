import React from 'react';
import Layout from './components/layout/Layout';
import { ThemeProvider } from 'styled-components';
import { GlobalStyles } from './styles/GlobalStyles';
import { lightTheme } from './styles/theme';

function App() {
  return (
    <ThemeProvider theme={lightTheme}>
      <GlobalStyles />
      <Layout />
    </ThemeProvider>
  );
}

export default App;
