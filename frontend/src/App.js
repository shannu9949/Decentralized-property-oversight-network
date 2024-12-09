import React from 'react';
import { useEffect, useState } from 'react';
import {
  ChakraProvider,
  Flex,
  Box,
  Text,
  Link,
  VStack,
  Code,
  Grid,
  theme,
  Button,
  ButtonGroup,
} from '@chakra-ui/react';
import { ColorModeSwitcher } from './ColorModeSwitcher';
import Header from './Header.js';
function App() {
  return (
    <ChakraProvider theme={theme}>
      <div>
        <Header />
      </div>
    </ChakraProvider>
  );
}

export default App;
