import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
      Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    background-color: ${props => props.theme.colors.background};
    color: ${props => props.theme.colors.text};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  button, input, select, textarea {
    font-family: inherit;
    font-size: inherit;
  }
  
  input, select, textarea {
    background-color: ${props => props.theme.colors.controlBg};
    border: 1px solid ${props => props.theme.colors.border};
    color: ${props => props.theme.colors.text};
    border-radius: ${props => props.theme.radius.sm};
  }
  
  button {
    cursor: pointer;
  }
`;
